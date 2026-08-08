import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Loan, LoanStatus } from './entities/loan.entity';
import { LoanRepayment, RepaymentStatus } from './entities/loan-repayment.entity';
import { SavingsTransaction, TransactionType } from '../savings/entities/savings-transaction.entity';
import { SavingsService } from '../savings/savings.service';
import { SavingsAccount } from '../savings/entities/savings-account.entity';
import { SettingsService } from '../settings/settings.service';
import { RiskService } from '../../common/risk.service';
import { UserActivityService } from '../users/user-activity.service';
import { AuditService } from '../../common/audit.service';
import { AuditAction } from '../../common/entities/audit-log.entity';
import { UsersService } from '../users/users.service';
import { KycStatus } from '../../common/enums/status.enum';

@Injectable()
export class LoansService {
  constructor(
    @InjectRepository(Loan)
    private readonly loanRepo: Repository<Loan>,
    @InjectRepository(LoanRepayment)
    private readonly repaymentRepo: Repository<LoanRepayment>,
    @InjectRepository(SavingsTransaction)
    private readonly savingsTxRepo: Repository<SavingsTransaction>,
    @InjectRepository(SavingsAccount)
    private readonly accountRepo: Repository<SavingsAccount>,
    private readonly savingsService: SavingsService,
    private readonly settingsService: SettingsService,
    private readonly activityService: UserActivityService,
    private readonly auditService: AuditService,
    private readonly usersService: UsersService,
    private readonly riskService: RiskService,
  ) {}

  async checkEligibility(userId: string) {
    const vestingMonths = await this.settingsService.getNumber('loan_vesting_months', 4);
    const multiplier = await this.settingsService.getNumber('loan_multiplier', 3);

    const user = await this.usersService.findById(userId);
    const kycApproved = user.kycStatus === KycStatus.APPROVED;

    const account = await this.savingsService.getAccount(userId);
    const savingsBalance = Number(account.balance);

    let vested = false;
    if (account?.id) {
      const now = new Date();
      let allMonths = true;
      for (let i = 0; i < vestingMonths; i++) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
        const count = await this.savingsTxRepo.count({
          where: {
            accountId: account.id,
            type: TransactionType.DEPOSIT,
            createdAt: Between(monthStart, monthEnd),
          },
        });
        if (count === 0) { allMonths = false; break; }
      }
      vested = allMonths;
    }

    const maxAmount = savingsBalance * multiplier;
    const activeLoans = await this.loanRepo.count({ where: { userId, status: LoanStatus.ACTIVE } });

    return {
      eligible: vested && savingsBalance > 0 && kycApproved,
      vested,
      savingsBalance,
      vestingMonths,
      multiplier,
      maxAmount: vested ? maxAmount : 0,
      activeLoans,
      reasons: [
        { key: 'kyc', label: 'KYC verification completed', passed: kycApproved },
        { key: 'savings', label: `Minimum ${vestingMonths} months of savings`, passed: vested },
        { key: 'balance', label: 'Positive savings balance', passed: savingsBalance > 0 },
      ],
    };
  }

  async apply(userId: string, dto: { amount: number; duration: number; purpose?: string }) {
    const { amount, duration, purpose } = dto;
    if (amount <= 0) throw new BadRequestException('Amount must be positive');
    if (duration < 1 || duration > 12) throw new BadRequestException('Duration must be 1-12 months');

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const todayCount = await this.loanRepo.count({
      where: { userId, createdAt: Between(startOfDay, new Date()) },
    });
    const dailyCountCheck = await this.riskService.checkCountLimit('max_daily_loan_applications', todayCount);
    if (dailyCountCheck && !dailyCountCheck.allowed) {
      throw new BadRequestException(`Maximum ${dailyCountCheck.limit} loan applications per day`);
    }

    const eligibility = await this.checkEligibility(userId);
    if (!eligibility.eligible) {
      throw new BadRequestException(
        'You are not eligible for a loan. You need to save consistently for at least ' +
        `${eligibility.vestingMonths} months to qualify.`,
      );
    }
    if (amount > eligibility.maxAmount) {
      throw new BadRequestException(
        `Loan amount exceeds maximum. Based on your savings of ₦${eligibility.savingsBalance.toLocaleString()}, ` +
        `the maximum loan is ₦${eligibility.maxAmount.toLocaleString()} (${eligibility.multiplier}x your savings).`,
      );
    }

    const maxAmountCheck = await this.riskService.checkMinMax('max_loan_amount', amount);
    if (maxAmountCheck && !maxAmountCheck.allowed) {
      throw new BadRequestException(`Maximum loan amount is ₦${maxAmountCheck.limit.toLocaleString()}`);
    }
    const minAmountCheck = await this.riskService.checkMin('min_loan_amount', amount);
    if (minAmountCheck && !minAmountCheck.allowed) {
      throw new BadRequestException(`Minimum loan amount is ₦${minAmountCheck.min.toLocaleString()}`);
    }
    const durationCheck = await this.riskService.checkMinMax('max_loan_duration_months', duration, 'months');
    if (durationCheck && !durationCheck.allowed) {
      throw new BadRequestException(`Maximum loan duration is ${durationCheck.limit} months`);
    }
    const savingsCheck = await this.riskService.checkMin('min_savings_for_loan', eligibility.savingsBalance);
    if (savingsCheck && !savingsCheck.allowed) {
      throw new BadRequestException(`Minimum savings balance of ₦${savingsCheck.min.toLocaleString()} required for a loan`);
    }

    const interestRate = 5;
    const totalInterest = (amount * interestRate) / 100;
    const totalRepayment = amount + totalInterest;
    const monthlyPayment = Math.round((totalRepayment / duration) * 100) / 100;

    const serviceFeePercent = await this.settingsService.getNumber('loan_service_fee_percent', 1);
    const serviceFee = Math.round((amount * serviceFeePercent) / 100 * 100) / 100;

    const loan = this.loanRepo.create({
      userId,
      amount,
      interestRate,
      duration,
      monthlyPayment,
      totalRepayment,
      amountPaid: 0,
      serviceFee,
      serviceFeePaid: false,
      purpose: purpose ?? undefined,
      status: LoanStatus.PENDING,
    });
    const saved = await this.loanRepo.save(loan);
    const loanId = (saved as any).id ?? (saved as any)[0]?.id;
    await this.activityService.log(userId, 'loan_apply', { amount, duration, serviceFee });

    const repayments: LoanRepayment[] = [];
    for (let i = 1; i <= duration; i++) {
      const dueDate = new Date();
      dueDate.setMonth(dueDate.getMonth() + i);
      repayments.push(this.repaymentRepo.create({
        loanId,
        dueDate,
        amount: monthlyPayment,
        status: RepaymentStatus.PENDING,
      }));
    }
    await this.repaymentRepo.save(repayments);

    return this.loanRepo.findOne({
      where: { id: loanId },
      relations: { repayments: true },
    });
  }

  async findByUser(userId: string) {
    return this.loanRepo.find({
      where: { userId },
      relations: { repayments: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string) {
    const loan = await this.loanRepo.findOne({
      where: { id, userId },
      relations: { repayments: true },
    });
    if (!loan) throw new NotFoundException('Loan not found');
    return loan;
  }

  async getActiveLoans(userId: string) {
    return this.loanRepo.find({
      where: { userId, status: LoanStatus.ACTIVE },
      relations: { repayments: true },
      order: { createdAt: 'DESC' },
    });
  }

  async getTotalOutstanding(userId: string) {
    const active = await this.loanRepo.find({
      where: { userId, status: LoanStatus.ACTIVE },
    });
    return active.reduce((sum, l) => sum + (Number(l.totalRepayment) - Number(l.amountPaid)), 0);
  }

  async findPending() {
    return this.loanRepo.find({
      where: { status: LoanStatus.PENDING },
      order: { createdAt: 'DESC' },
    });
  }

  async approve(loanId: string, approvedBy: string) {
    const loan = await this.loanRepo.findOne({ where: { id: loanId } });
    if (!loan) throw new NotFoundException('Loan not found');
    if (loan.status !== LoanStatus.PENDING) throw new BadRequestException('Loan is not pending');

    const sFee = Number(loan.serviceFee);
    if (sFee > 0) {
      const account = await this.savingsService.getOrCreateAccount(loan.userId);
      const balance = Number(account.balance);
      if (balance < sFee) {
        throw new BadRequestException(
          `Insufficient savings balance to pay service fee of ₦${sFee.toLocaleString()}. ` +
          `Available: ₦${balance.toLocaleString()}`,
        );
      }

      const balanceAfter = balance - sFee;
      await this.accountRepo.update(account.id, { balance: balanceAfter });

      const tx = await this.savingsTxRepo.save(this.savingsTxRepo.create({
        accountId: account.id,
        type: TransactionType.LOAN_SERVICE_FEE,
        amount: sFee,
        balanceBefore: balance,
        balanceAfter,
        description: `Loan service fee for loan ${loan.id}`,
      }));

      loan.serviceFeePaid = true;
      loan.serviceFeePaidAt = new Date();
      loan.serviceFeeTxId = tx.id;
    } else {
      loan.serviceFeePaid = true;
      loan.serviceFeePaidAt = new Date();
    }

    loan.status = LoanStatus.ACTIVE;
    await this.loanRepo.save(loan);

    await this.activityService.log(loan.userId, 'loan_approve', { loanId, approvedBy, serviceFee: sFee });
    await this.auditService.log(AuditAction.LOAN_APPROVE, {
      entityType: 'loan',
      entityId: loan.id,
      performedBy: approvedBy,
      metadata: { userId: loan.userId, amount: loan.amount, serviceFee: sFee },
    });

    return this.loanRepo.findOne({
      where: { id: loan.id },
      relations: { repayments: true },
    });
  }

  async reject(loanId: string, rejectedBy: string) {
    const loan = await this.loanRepo.findOne({ where: { id: loanId } });
    if (!loan) throw new NotFoundException('Loan not found');
    if (loan.status !== LoanStatus.PENDING) throw new BadRequestException('Loan is not pending');

    loan.status = LoanStatus.REJECTED;
    await this.loanRepo.save(loan);

    await this.activityService.log(loan.userId, 'loan_reject', { loanId, rejectedBy });
    await this.auditService.log(AuditAction.LOAN_REJECT, {
      entityType: 'loan',
      entityId: loan.id,
      performedBy: rejectedBy,
      metadata: { userId: loan.userId, amount: loan.amount },
    });

    return this.loanRepo.findOne({
      where: { id: loan.id },
      relations: { repayments: true },
    });
  }

  /**
   * Load a repayment for a member, ensuring it belongs to the user and is
   * actually payable (pending + parent loan active). Returns null if not
   * payable so an external payment instruction can be issued safely.
   */
  async getRepaymentForPayment(
    userId: string,
    repaymentId: string,
  ): Promise<LoanRepayment | null> {
    const repayment = await this.repaymentRepo.findOne({
      where: { id: repaymentId },
      relations: { loan: true },
    });
    if (!repayment || repayment.loan.userId !== userId) return null;
    if (repayment.loan.status !== LoanStatus.ACTIVE) return null;
    return repayment.status === RepaymentStatus.PAID ? null : repayment;
  }

  /**
   * Idempotently mark a repayment paid. Returns { paid: boolean, loan } where
   * paid=false when the repayment is already settled or not payable.
   */
  async markRepaymentPaid(
    userId: string,
    repaymentId: string,
  ): Promise<{ paid: boolean; loan: Loan | null }> {
    const repayment = await this.repaymentRepo.findOne({
      where: { id: repaymentId },
      relations: { loan: true },
    });
    if (!repayment) throw new NotFoundException('Repayment not found');
    if (repayment.loan.userId !== userId) throw new NotFoundException('Repayment not found');
    if (repayment.status === RepaymentStatus.PAID) return { paid: false, loan: null };
    if (repayment.loan.status !== LoanStatus.ACTIVE) throw new BadRequestException('Loan is not active');

    const now = new Date();
    repayment.status = RepaymentStatus.PAID;
    repayment.paidAt = now;
    await this.repaymentRepo.save(repayment);

    const loan = repayment.loan;
    const newAmountPaid = Number(loan.amountPaid) + Number(repayment.amount);
    loan.amountPaid = newAmountPaid;

    const remaining = await this.repaymentRepo.count({
      where: { loanId: loan.id, status: RepaymentStatus.PENDING },
    });
    if (remaining === 0) {
      loan.status = LoanStatus.COMPLETED;
    }

    await this.loanRepo.save(loan);
    const refreshed = await this.loanRepo.findOne({
      where: { id: loan.id },
      relations: { repayments: true },
    });
    return { paid: true, loan: refreshed };
  }

  async getAllActiveTotal() {
    const result = await this.loanRepo
      .createQueryBuilder('l')
      .select('COALESCE(SUM(l.total_repayment - l.amount_paid), 0)', 'total')
      .where('l.status = :status', { status: LoanStatus.ACTIVE })
      .getRawOne<{ total: string }>();
    return Number(result?.total || 0);
  }

  async getDefaultedLoans() {
    return this.loanRepo.find({
      where: { status: LoanStatus.DEFAULTED },
      order: { createdAt: 'DESC' },
    });
  }
}
