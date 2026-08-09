"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoansService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const loan_entity_1 = require("./entities/loan.entity");
const loan_repayment_entity_1 = require("./entities/loan-repayment.entity");
const savings_transaction_entity_1 = require("../savings/entities/savings-transaction.entity");
const savings_service_1 = require("../savings/savings.service");
const savings_account_entity_1 = require("../savings/entities/savings-account.entity");
const settings_service_1 = require("../settings/settings.service");
const risk_service_1 = require("../../common/risk.service");
const user_activity_service_1 = require("../users/user-activity.service");
const audit_service_1 = require("../../common/audit.service");
const audit_log_entity_1 = require("../../common/entities/audit-log.entity");
const users_service_1 = require("../users/users.service");
const status_enum_1 = require("../../common/enums/status.enum");
const role_enum_1 = require("../../common/enums/role.enum");
let LoansService = class LoansService {
    loanRepo;
    repaymentRepo;
    savingsTxRepo;
    accountRepo;
    savingsService;
    settingsService;
    activityService;
    auditService;
    usersService;
    riskService;
    constructor(loanRepo, repaymentRepo, savingsTxRepo, accountRepo, savingsService, settingsService, activityService, auditService, usersService, riskService) {
        this.loanRepo = loanRepo;
        this.repaymentRepo = repaymentRepo;
        this.savingsTxRepo = savingsTxRepo;
        this.accountRepo = accountRepo;
        this.savingsService = savingsService;
        this.settingsService = settingsService;
        this.activityService = activityService;
        this.auditService = auditService;
        this.usersService = usersService;
        this.riskService = riskService;
    }
    async checkEligibility(userId) {
        const vestingMonths = await this.settingsService.getNumber('loan_vesting_months', 4);
        const multiplier = await this.settingsService.getNumber('loan_multiplier', 3);
        const user = await this.usersService.findById(userId);
        const kycApproved = user.kycStatus === status_enum_1.KycStatus.APPROVED;
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
                        type: savings_transaction_entity_1.TransactionType.DEPOSIT,
                        createdAt: (0, typeorm_2.Between)(monthStart, monthEnd),
                    },
                });
                if (count === 0) {
                    allMonths = false;
                    break;
                }
            }
            vested = allMonths;
        }
        const maxAmount = savingsBalance * multiplier;
        const activeLoans = await this.loanRepo.count({ where: { userId, status: loan_entity_1.LoanStatus.ACTIVE } });
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
    async apply(userId, dto) {
        const { amount, duration, purpose } = dto;
        if (amount <= 0)
            throw new common_1.BadRequestException('Amount must be positive');
        if (duration < 1 || duration > 12)
            throw new common_1.BadRequestException('Duration must be 1-12 months');
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const todayCount = await this.loanRepo.count({
            where: { userId, createdAt: (0, typeorm_2.Between)(startOfDay, new Date()) },
        });
        const dailyCountCheck = await this.riskService.checkCountLimit('max_daily_loan_applications', todayCount);
        if (dailyCountCheck && !dailyCountCheck.allowed) {
            throw new common_1.BadRequestException(`Maximum ${dailyCountCheck.limit} loan applications per day`);
        }
        const eligibility = await this.checkEligibility(userId);
        if (!eligibility.eligible) {
            throw new common_1.BadRequestException('You are not eligible for a loan. You need to save consistently for at least ' +
                `${eligibility.vestingMonths} months to qualify.`);
        }
        if (amount > eligibility.maxAmount) {
            throw new common_1.BadRequestException(`Loan amount exceeds maximum. Based on your savings of ₦${eligibility.savingsBalance.toLocaleString()}, ` +
                `the maximum loan is ₦${eligibility.maxAmount.toLocaleString()} (${eligibility.multiplier}x your savings).`);
        }
        const maxAmountCheck = await this.riskService.checkMinMax('max_loan_amount', amount);
        if (maxAmountCheck && !maxAmountCheck.allowed) {
            throw new common_1.BadRequestException(`Maximum loan amount is ₦${maxAmountCheck.limit.toLocaleString()}`);
        }
        const minAmountCheck = await this.riskService.checkMin('min_loan_amount', amount);
        if (minAmountCheck && !minAmountCheck.allowed) {
            throw new common_1.BadRequestException(`Minimum loan amount is ₦${minAmountCheck.min.toLocaleString()}`);
        }
        const durationCheck = await this.riskService.checkMinMax('max_loan_duration_months', duration, 'months');
        if (durationCheck && !durationCheck.allowed) {
            throw new common_1.BadRequestException(`Maximum loan duration is ${durationCheck.limit} months`);
        }
        const savingsCheck = await this.riskService.checkMin('min_savings_for_loan', eligibility.savingsBalance);
        if (savingsCheck && !savingsCheck.allowed) {
            throw new common_1.BadRequestException(`Minimum savings balance of ₦${savingsCheck.min.toLocaleString()} required for a loan`);
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
            status: loan_entity_1.LoanStatus.PENDING,
        });
        const saved = await this.loanRepo.save(loan);
        const loanId = saved.id ?? saved[0]?.id;
        await this.activityService.log(userId, 'loan_apply', { amount, duration, serviceFee });
        const repayments = [];
        for (let i = 1; i <= duration; i++) {
            const dueDate = new Date();
            dueDate.setMonth(dueDate.getMonth() + i);
            repayments.push(this.repaymentRepo.create({
                loanId,
                dueDate,
                amount: monthlyPayment,
                status: loan_repayment_entity_1.RepaymentStatus.PENDING,
            }));
        }
        await this.repaymentRepo.save(repayments);
        return this.loanRepo.findOne({
            where: { id: loanId },
            relations: { repayments: true },
        });
    }
    async findByUser(userId) {
        return this.loanRepo.find({
            where: { userId },
            relations: { repayments: true },
            order: { createdAt: 'DESC' },
        });
    }
    async findOne(id, userId) {
        const loan = await this.loanRepo.findOne({
            where: { id, userId },
            relations: { repayments: true },
        });
        if (!loan)
            throw new common_1.NotFoundException('Loan not found');
        return loan;
    }
    async getActiveLoans(userId) {
        return this.loanRepo.find({
            where: { userId, status: loan_entity_1.LoanStatus.ACTIVE },
            relations: { repayments: true },
            order: { createdAt: 'DESC' },
        });
    }
    async getTotalOutstanding(userId) {
        const active = await this.loanRepo.find({
            where: { userId, status: loan_entity_1.LoanStatus.ACTIVE },
        });
        return active.reduce((sum, l) => sum + (Number(l.totalRepayment) - Number(l.amountPaid)), 0);
    }
    async findPending() {
        return this.loanRepo.find({
            where: { status: loan_entity_1.LoanStatus.PENDING },
            order: { createdAt: 'DESC' },
        });
    }
    async getStageLoans(stage, reviewer) {
        const status = stage === 'apex'
            ? loan_entity_1.LoanStatus.PENDING
            : stage === 'organization'
                ? loan_entity_1.LoanStatus.APEX_APPROVED
                : stage === 'admin'
                    ? loan_entity_1.LoanStatus.ORG_APPROVED
                    : loan_entity_1.LoanStatus.APPROVED;
        const loans = await this.loanRepo.find({
            where: { status },
            order: { createdAt: 'DESC' },
            relations: { repayments: true },
        });
        if (!reviewer)
            return loans;
        const filtered = [];
        for (const loan of loans) {
            const withBorrower = await this.loadLoanWithBorrower(loan.id);
            if (this.scopeForLoan(withBorrower, reviewer)) {
                filtered.push(withBorrower);
            }
        }
        return filtered;
    }
    async loadLoanWithRepayments(id) {
        return this.loanRepo.findOne({
            where: { id },
            relations: { repayments: true },
        });
    }
    async loadLoanWithBorrower(id) {
        const loan = await this.loanRepo.findOne({ where: { id } });
        if (!loan)
            throw new common_1.NotFoundException('Loan not found');
        const borrower = await this.usersService.findById(loan.userId).catch(() => null);
        loan.borrower = {
            apexOrgId: borrower?.apexOrgId ?? null,
            organizationId: borrower?.organizationId ?? null,
        };
        return loan;
    }
    scopeForLoan(loan, reviewer) {
        if (reviewer.role === role_enum_1.Role.SUPER_ADMIN || reviewer.role === role_enum_1.Role.OPERATIONAL_ADMIN)
            return true;
        if (loan.borrower) {
            if (reviewer.role === role_enum_1.Role.APEX_BUSINESS_MANAGER) {
                return !!loan.borrower.apexOrgId && loan.borrower.apexOrgId === reviewer.apexOrgId;
            }
            if (reviewer.role === role_enum_1.Role.BUSINESS_MANAGER) {
                return !!loan.borrower.organizationId && loan.borrower.organizationId === reviewer.organizationId;
            }
            if (reviewer.role === role_enum_1.Role.ACCOUNTANT) {
                return !!loan.borrower.organizationId && loan.borrower.organizationId === reviewer.organizationId;
            }
        }
        return reviewer.role === role_enum_1.Role.LOAN_MANAGER;
    }
    async approveApex(loanId, reviewer) {
        const loan = await this.loadLoanWithBorrower(loanId);
        if (loan.status !== loan_entity_1.LoanStatus.PENDING)
            throw new common_1.BadRequestException('Loan is not awaiting apex approval');
        if (!this.scopeForLoan(loan, reviewer))
            throw new common_1.ForbiddenException('Loan is not in your apex organization scope');
        loan.status = loan_entity_1.LoanStatus.APEX_APPROVED;
        loan.apexApprovedBy = reviewer.sub;
        loan.apexApprovedAt = new Date();
        await this.loanRepo.save(loan);
        await this.activityService.log(loan.userId, 'loan_apex_approve', { loanId, by: reviewer.sub });
        await this.auditService.log(audit_log_entity_1.AuditAction.LOAN_APPROVE, {
            entityType: 'loan', entityId: loan.id, performedBy: reviewer.sub,
            metadata: { stage: 'apex', userId: loan.userId, amount: loan.amount },
        });
        return this.loadLoanWithRepayments(loan.id);
    }
    async approveOrganization(loanId, reviewer) {
        const loan = await this.loadLoanWithBorrower(loanId);
        if (loan.status !== loan_entity_1.LoanStatus.APEX_APPROVED)
            throw new common_1.BadRequestException('Loan is not awaiting organization approval');
        if (!this.scopeForLoan(loan, reviewer))
            throw new common_1.ForbiddenException('Loan is not in your organization scope');
        loan.status = loan_entity_1.LoanStatus.ORG_APPROVED;
        loan.orgApprovedBy = reviewer.sub;
        loan.orgApprovedAt = new Date();
        await this.loanRepo.save(loan);
        await this.activityService.log(loan.userId, 'loan_org_approve', { loanId, by: reviewer.sub });
        await this.auditService.log(audit_log_entity_1.AuditAction.LOAN_APPROVE, {
            entityType: 'loan', entityId: loan.id, performedBy: reviewer.sub,
            metadata: { stage: 'organization', userId: loan.userId, amount: loan.amount },
        });
        return this.loadLoanWithRepayments(loan.id);
    }
    async approveFinal(loanId, reviewer) {
        const loan = await this.loadLoanWithBorrower(loanId);
        if (loan.status !== loan_entity_1.LoanStatus.ORG_APPROVED)
            throw new common_1.BadRequestException('Loan is not awaiting admin approval');
        if (!this.scopeForLoan(loan, { ...reviewer, role: role_enum_1.Role.OPERATIONAL_ADMIN })) {
            throw new common_1.ForbiddenException('Loan is not in your scope');
        }
        loan.status = loan_entity_1.LoanStatus.APPROVED;
        loan.adminApprovedBy = reviewer.sub;
        loan.adminApprovedAt = new Date();
        await this.loanRepo.save(loan);
        await this.activityService.log(loan.userId, 'loan_admin_approve', { loanId, by: reviewer.sub });
        await this.auditService.log(audit_log_entity_1.AuditAction.LOAN_APPROVE, {
            entityType: 'loan', entityId: loan.id, performedBy: reviewer.sub,
            metadata: { stage: 'admin', userId: loan.userId, amount: loan.amount },
        });
        return this.loadLoanWithRepayments(loan.id);
    }
    async disburse(loanId, reviewer) {
        const loan = await this.loadLoanWithBorrower(loanId);
        if (loan.status !== loan_entity_1.LoanStatus.APPROVED)
            throw new common_1.BadRequestException('Loan is not awaiting disbursement');
        if (!this.scopeForLoan(loan, reviewer))
            throw new common_1.ForbiddenException('Loan is not in your organization scope');
        const charges = [Number(loan.serviceFee || 0)].filter((c) => c > 0);
        const gross = Number(loan.amount);
        const totalCharges = charges.reduce((s, c) => s + c, 0);
        const payoutAmount = Math.max(0, gross - totalCharges);
        const account = await this.savingsService.getOrCreateAccount(loan.userId);
        const balanceBefore = Number(account.balance);
        const balanceAfter = balanceBefore + payoutAmount;
        await this.accountRepo.update(account.id, { balance: balanceAfter });
        await this.savingsTxRepo.save(this.savingsTxRepo.create({
            accountId: account.id,
            type: savings_transaction_entity_1.TransactionType.LOAN_DISBURSEMENT,
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
        loan.status = loan_entity_1.LoanStatus.ACTIVE;
        await this.loanRepo.save(loan);
        await this.activityService.log(loan.userId, 'loan_disburse', {
            loanId, by: reviewer.sub, gross, charges: totalCharges, payoutAmount,
        });
        await this.auditService.log(audit_log_entity_1.AuditAction.LOAN_APPROVE, {
            entityType: 'loan', entityId: loan.id, performedBy: reviewer.sub,
            metadata: { stage: 'disbursement', userId: loan.userId, gross, charges: totalCharges, payoutAmount },
        });
        return this.loadLoanWithRepayments(loan.id);
    }
    async reject(loanId, rejectedBy, reason) {
        const loan = await this.loanRepo.findOne({ where: { id: loanId } });
        if (!loan)
            throw new common_1.NotFoundException('Loan not found');
        if ([loan_entity_1.LoanStatus.COMPLETED, loan_entity_1.LoanStatus.REJECTED, loan_entity_1.LoanStatus.DEFAULTED].includes(loan.status)) {
            throw new common_1.BadRequestException('Loan has already been decided');
        }
        loan.status = loan_entity_1.LoanStatus.REJECTED;
        loan.rejectedBy = rejectedBy;
        loan.rejectedAt = new Date();
        loan.rejectionReason = reason ?? null;
        await this.loanRepo.save(loan);
        await this.activityService.log(loan.userId, 'loan_reject', { loanId, rejectedBy, reason });
        await this.auditService.log(audit_log_entity_1.AuditAction.LOAN_REJECT, {
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
    async getRepaymentForPayment(userId, repaymentId) {
        const repayment = await this.repaymentRepo.findOne({
            where: { id: repaymentId },
            relations: { loan: true },
        });
        if (!repayment || repayment.loan.userId !== userId)
            return null;
        if (repayment.loan.status !== loan_entity_1.LoanStatus.ACTIVE)
            return null;
        return repayment.status === loan_repayment_entity_1.RepaymentStatus.PAID ? null : repayment;
    }
    async markRepaymentPaid(userId, repaymentId) {
        const repayment = await this.repaymentRepo.findOne({
            where: { id: repaymentId },
            relations: { loan: true },
        });
        if (!repayment)
            throw new common_1.NotFoundException('Repayment not found');
        if (repayment.loan.userId !== userId)
            throw new common_1.NotFoundException('Repayment not found');
        if (repayment.status === loan_repayment_entity_1.RepaymentStatus.PAID)
            return { paid: false, loan: null };
        if (repayment.loan.status !== loan_entity_1.LoanStatus.ACTIVE)
            throw new common_1.BadRequestException('Loan is not active');
        const now = new Date();
        repayment.status = loan_repayment_entity_1.RepaymentStatus.PAID;
        repayment.paidAt = now;
        await this.repaymentRepo.save(repayment);
        const loan = repayment.loan;
        const newAmountPaid = Number(loan.amountPaid) + Number(repayment.amount);
        loan.amountPaid = newAmountPaid;
        const remaining = await this.repaymentRepo.count({
            where: { loanId: loan.id, status: loan_repayment_entity_1.RepaymentStatus.PENDING },
        });
        if (remaining === 0) {
            loan.status = loan_entity_1.LoanStatus.COMPLETED;
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
            .where('l.status = :status', { status: loan_entity_1.LoanStatus.ACTIVE })
            .getRawOne();
        return Number(result?.total || 0);
    }
    async getDefaultedLoans() {
        return this.loanRepo.find({
            where: { status: loan_entity_1.LoanStatus.DEFAULTED },
            order: { createdAt: 'DESC' },
        });
    }
};
exports.LoansService = LoansService;
exports.LoansService = LoansService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(loan_entity_1.Loan)),
    __param(1, (0, typeorm_1.InjectRepository)(loan_repayment_entity_1.LoanRepayment)),
    __param(2, (0, typeorm_1.InjectRepository)(savings_transaction_entity_1.SavingsTransaction)),
    __param(3, (0, typeorm_1.InjectRepository)(savings_account_entity_1.SavingsAccount)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        savings_service_1.SavingsService,
        settings_service_1.SettingsService,
        user_activity_service_1.UserActivityService,
        audit_service_1.AuditService,
        users_service_1.UsersService,
        risk_service_1.RiskService])
], LoansService);
//# sourceMappingURL=loans.service.js.map