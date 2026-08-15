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
import { User } from '../users/entities/user.entity';
import { KycStatus } from '../../common/enums/status.enum';
import { Role } from '../../common/enums/role.enum';

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
      const months: string[] = [];
      for (let i = 0; i < vestingMonths; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
      }
      const earliest = new Date(now.getFullYear(), now.getMonth() - (vestingMonths - 1), 1);

      const rows: Array<{ month: string }> = await this.savingsTxRepo.manager.query(
        `SELECT DISTINCT to_char(created_at, 'YYYY-MM') AS month
         FROM savings_transactions
         WHERE account_id = $1
           AND type = $2
           AND created_at >= $3`,
        [account.id, TransactionType.DEPOSIT, earliest],
      );

      const present = new Set(rows.map((r) => r.month));
      vested = months.every((m) => present.has(m));
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

  /** Loans awaiting a specific approval stage, optionally scoped by reviewer. */
  async getStageLoans(
    stage: 'apex' | 'organization' | 'admin' | 'disbursement',
    reviewer?: { role: Role; apexOrgId?: string; organizationId?: string },
  ) {
    const status =
      stage === 'apex'
        ? LoanStatus.PENDING
        : stage === 'organization'
          ? LoanStatus.APEX_APPROVED
          : stage === 'admin'
            ? LoanStatus.ORG_APPROVED
            : LoanStatus.APPROVED;

    const loans = await this.loanRepo.find({
      where: { status },
      order: { createdAt: 'DESC' },
      relations: { repayments: true },
    });
    if (!reviewer) {
      const users = await this.usersService
        .findByIds(loans.map((l) => l.userId))
        .catch(() => [] as User[]);
      return this.attachBorrowers(loans, users);
    }

    const users = await this.usersService
      .findByIds(loans.map((l) => l.userId))
      .catch(() => [] as User[]);
    const withBorrower = this.attachBorrowers(loans, users);

    return withBorrower.filter((loan) => this.scopeForLoan(loan, reviewer));
  }

  private attachBorrowers(loans: Loan[], users: User[]): Loan[] {
    const byId = new Map<string, User>(users.map((u) => [u.id, u]));
    for (const loan of loans) {
      const borrower = byId.get(loan.userId);
      loan.borrower = {
        apexOrgId: borrower?.apexOrgId ?? null,
        organizationId: borrower?.organizationId ?? null,
        name: borrower ? `${borrower.firstName ?? ''} ${borrower.lastName ?? ''}`.trim() || borrower.email : undefined,
        email: borrower?.email,
      };
    }
    return loans;
  }

  private async loadLoanWithRepayments(id: string) {
    return this.loanRepo.findOne({
      where: { id },
      relations: { repayments: true },
    });
  }

  private async loadLoanWithBorrower(id: string) {
    const loan = await this.loanRepo.findOne({ where: { id } });
    if (!loan) throw new NotFoundException('Loan not found');
    const borrower = await this.usersService.findById(loan.userId).catch(() => null);
    loan.borrower = {
      apexOrgId: borrower?.apexOrgId ?? null,
      organizationId: borrower?.organizationId ?? null,
      name: borrower ? `${borrower.firstName ?? ''} ${borrower.lastName ?? ''}`.trim() || borrower.email : undefined,
      email: borrower?.email,
    };
    return loan;
  }

  /**
   * Each approver can only act on loans whose borrower sits in their scope
   * (apex org, organization, or system-wide for super admin).
   */
  private scopeForLoan(
    loan: Loan,
    reviewer: { apexOrgId?: string; organizationId?: string; role: Role },
  ): boolean {
    if (reviewer.role === Role.SUPER_ADMIN || reviewer.role === Role.OPERATIONAL_ADMIN) return true;
    if (loan.borrower) {
      if (reviewer.role === Role.APEX_BUSINESS_MANAGER) {
        return !!loan.borrower.apexOrgId && loan.borrower.apexOrgId === reviewer.apexOrgId;
      }
      if (reviewer.role === Role.BUSINESS_MANAGER) {
        return !!loan.borrower.organizationId && loan.borrower.organizationId === reviewer.organizationId;
      }
      if (reviewer.role === Role.ACCOUNTANT) {
        return !!loan.borrower.organizationId && loan.borrower.organizationId === reviewer.organizationId;
      }
    }
    return reviewer.role === Role.LOAN_MANAGER;
  }

  /** Stage 1 — final approval by the apex organization the borrower belongs to. */
  async approveApex(loanId: string, reviewer: { sub: string; role: Role; apexOrgId?: string; organizationId?: string }) {
    const loan = await this.loadLoanWithBorrower(loanId);
    if (loan.status !== LoanStatus.PENDING) throw new BadRequestException('Loan is not awaiting apex approval');
    if (!this.scopeForLoan(loan, reviewer)) throw new ForbiddenException('Loan is not in your apex organization scope');
    loan.status = LoanStatus.APEX_APPROVED;
    loan.apexApprovedBy = reviewer.sub;
    loan.apexApprovedAt = new Date();
    await this.loanRepo.save(loan);
    await this.activityService.log(loan.userId, 'loan_apex_approve', { loanId, by: reviewer.sub });
    await this.auditService.log(AuditAction.LOAN_APPROVE, {
      entityType: 'loan', entityId: loan.id, performedBy: reviewer.sub,
      metadata: { stage: 'apex', userId: loan.userId, amount: loan.amount },
    });
    return this.loadLoanWithRepayments(loan.id);
  }

  /** Stage 2 — approval by the organization the borrower belongs to. */
  async approveOrganization(loanId: string, reviewer: { sub: string; role: Role; apexOrgId?: string; organizationId?: string }) {
    const loan = await this.loadLoanWithBorrower(loanId);
    if (loan.status !== LoanStatus.APEX_APPROVED) throw new BadRequestException('Loan is not awaiting organization approval');
    if (!this.scopeForLoan(loan, reviewer)) throw new ForbiddenException('Loan is not in your organization scope');
    loan.status = LoanStatus.ORG_APPROVED;
    loan.orgApprovedBy = reviewer.sub;
    loan.orgApprovedAt = new Date();
    await this.loanRepo.save(loan);
    await this.activityService.log(loan.userId, 'loan_org_approve', { loanId, by: reviewer.sub });
    await this.auditService.log(AuditAction.LOAN_APPROVE, {
      entityType: 'loan', entityId: loan.id, performedBy: reviewer.sub,
      metadata: { stage: 'organization', userId: loan.userId, amount: loan.amount },
    });
    return this.loadLoanWithRepayments(loan.id);
  }

  /** Stage 3 — final approval by admin / super-admin. */
  async approveFinal(loanId: string, reviewer: { sub: string; role: Role; apexOrgId?: string; organizationId?: string }) {
    const loan = await this.loadLoanWithBorrower(loanId);
    if (loan.status !== LoanStatus.ORG_APPROVED) throw new BadRequestException('Loan is not awaiting admin approval');
    if (!this.scopeForLoan(loan, { ...reviewer, role: Role.OPERATIONAL_ADMIN })) {
      throw new ForbiddenException('Loan is not in your scope');
    }
    loan.status = LoanStatus.APPROVED;
    loan.adminApprovedBy = reviewer.sub;
    loan.adminApprovedAt = new Date();
    await this.loanRepo.save(loan);
    await this.activityService.log(loan.userId, 'loan_admin_approve', { loanId, by: reviewer.sub });
    await this.auditService.log(AuditAction.LOAN_APPROVE, {
      entityType: 'loan', entityId: loan.id, performedBy: reviewer.sub,
      metadata: { stage: 'admin', userId: loan.userId, amount: loan.amount },
    });
    return this.loadLoanWithRepayments(loan.id);
  }

  /**
   * Stage 4 — accountant disburses. Fees and charges are deducted from the
   * loaned amount; net difference is the exact amount disbursed.
   */
  async disburse(loanId: string, reviewer: { sub: string; role: Role; apexOrgId?: string; organizationId?: string }) {
    const loan = await this.loadLoanWithBorrower(loanId);
    if (loan.status !== LoanStatus.APPROVED) throw new BadRequestException('Loan is not awaiting disbursement');
    if (!this.scopeForLoan(loan, reviewer)) throw new ForbiddenException('Loan is not in your organization scope');

    const charges = [Number(loan.serviceFee || 0)].filter((c) => c > 0);
    const gross = Number(loan.amount);
    const totalCharges = charges.reduce((s, c) => s + c, 0);
    const payoutAmount = Math.max(0, gross - totalCharges);

    // Credit the payout to the member's savings account (loan_disbursement).
    const account = await this.savingsService.getOrCreateAccount(loan.userId);
    const balanceBefore = Number(account.balance);
    const balanceAfter = balanceBefore + payoutAmount;
    await this.accountRepo.update(account.id, { balance: balanceAfter });
    await this.savingsTxRepo.save(this.savingsTxRepo.create({
      accountId: account.id,
      type: TransactionType.LOAN_DISBURSEMENT,
      amount: payoutAmount,
      balanceBefore,
      balanceAfter,
      description: `Loan disbursement for loan ${loan.id} (gross ₦${gross.toLocaleString()} less charges ₦${totalCharges.toLocaleString()})`,
    }));

    loan.disbursedAmount = payoutAmount;
    loan.disbursedBy = reviewer.sub;
    loan.disbursedAt = new Date();
    loan.serviceFeePaid = true;
    loan.serviceFeePaidAt = new Date();
    loan.status = LoanStatus.ACTIVE;
    await this.loanRepo.save(loan);

    await this.activityService.log(loan.userId, 'loan_disburse', {
      loanId, by: reviewer.sub, gross, charges: totalCharges, payoutAmount,
    });
    await this.auditService.log(AuditAction.LOAN_APPROVE, {
      entityType: 'loan', entityId: loan.id, performedBy: reviewer.sub,
      metadata: { stage: 'disbursement', userId: loan.userId, gross, charges: totalCharges, payoutAmount },
    });

    return this.loadLoanWithRepayments(loan.id);
  }

  /** Reject at any stage. */
  async reject(loanId: string, rejectedBy: string, reason?: string) {
    const loan = await this.loanRepo.findOne({ where: { id: loanId } });
    if (!loan) throw new NotFoundException('Loan not found');
    if ([LoanStatus.COMPLETED, LoanStatus.REJECTED, LoanStatus.DEFAULTED].includes(loan.status)) {
      throw new BadRequestException('Loan has already been decided');
    }

    loan.status = LoanStatus.REJECTED;
    loan.rejectedBy = rejectedBy;
    loan.rejectedAt = new Date();
    loan.rejectionReason = reason ?? null;
    await this.loanRepo.save(loan);

    await this.activityService.log(loan.userId, 'loan_reject', { loanId, rejectedBy, reason });
    await this.auditService.log(AuditAction.LOAN_REJECT, {
      entityType: 'loan',
      entityId: loan.id,
      performedBy: rejectedBy,
      metadata: { userId: loan.userId, amount: loan.amount, reason },
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
