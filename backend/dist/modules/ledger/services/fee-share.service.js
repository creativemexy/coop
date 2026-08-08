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
var FeeShareService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeeShareService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const fee_share_ledger_entity_1 = require("../entities/fee-share-ledger.entity");
const fee_pot_entity_1 = require("../entities/fee-pot.entity");
const fee_withdrawal_request_entity_1 = require("../entities/fee-withdrawal-request.entity");
const status_enum_1 = require("../../../common/enums/status.enum");
const role_enum_1 = require("../../../common/enums/role.enum");
const settings_service_1 = require("../../settings/settings.service");
const organization_entity_1 = require("../../organizations/entities/organization.entity");
const apex_organization_entity_1 = require("../../apex-organizations/entities/apex-organization.entity");
const paystack_client_1 = require("../../payments/providers/paystack/paystack.client");
let FeeShareService = FeeShareService_1 = class FeeShareService {
    ledgerRepo;
    potRepo;
    withdrawalRepo;
    orgRepo;
    apexOrgRepo;
    settingsService;
    paystackClient;
    logger = new common_1.Logger(FeeShareService_1.name);
    payoutInFlight = new Set();
    constructor(ledgerRepo, potRepo, withdrawalRepo, orgRepo, apexOrgRepo, settingsService, paystackClient) {
        this.ledgerRepo = ledgerRepo;
        this.potRepo = potRepo;
        this.withdrawalRepo = withdrawalRepo;
        this.orgRepo = orgRepo;
        this.apexOrgRepo = apexOrgRepo;
        this.settingsService = settingsService;
        this.paystackClient = paystackClient;
    }
    potLockKey(potType, entityId) {
        return `${potType}:${entityId}`;
    }
    async settleAmbiguousOutcome(request, pot, reference, errorMessage, actorId) {
        let verified = null;
        try {
            verified = await this.paystackClient.verifyTransfer(reference);
        }
        catch (error) {
            this.logger.error(`Could not verify transfer ${reference}: ${error.message}`);
            verified = null;
        }
        if (verified && (verified.status === 'failed' || verified.status === 'reversed')) {
            request.status = status_enum_1.PayoutStatus.FAILED;
            request.paystackReference = verified.reference;
            request.note = `Payout failed: ${errorMessage}`;
            await this.withdrawalRepo.save(request);
            return false;
        }
        if (verified) {
            request.status = status_enum_1.PayoutStatus.COMPLETED;
            request.approvedBy = actorId;
            request.paystackReference = verified.reference;
            request.note = `Auto-paid via Paystack balance (ref: ${verified.reference})`;
        }
        else {
            request.status = status_enum_1.PayoutStatus.COMPLETED;
            request.approvedBy = actorId;
            request.paystackReference = reference;
            request.note = 'Payout status uncertain — verify on Paystack dashboard before any retry';
        }
        await this.withdrawalRepo.save(request);
        pot.balance = 0;
        await this.potRepo.save(pot);
        return true;
    }
    async recordRegistrationFee(params) {
        const existing = await this.ledgerRepo.findOne({
            where: { paymentId: params.paymentId, source: status_enum_1.FeeSource.REGISTRATION },
        });
        if (existing) {
            return existing;
        }
        const platformPercent = await this.settingsService
            .getNumber('fee_platform_percent', 30) / 100;
        const superAdminPercent = await this.settingsService
            .getNumber('fee_super_admin_percent', 20) / 100;
        const orgPercent = await this.settingsService
            .getNumber('fee_organization_percent', 35) / 100;
        const apexPercent = await this.settingsService
            .getNumber('fee_apex_percent', 15) / 100;
        const superAdminShare = params.totalFee * superAdminPercent;
        const platformShare = params.totalFee * platformPercent;
        const orgShare = params.totalFee * orgPercent;
        const apexShare = params.totalFee * apexPercent;
        const record = this.ledgerRepo.create({
            paymentId: params.paymentId,
            source: status_enum_1.FeeSource.REGISTRATION,
            totalFee: params.totalFee,
            superAdminShare,
            superAdminUserId: 'SYSTEM',
            platformShare: platformShare,
            organizationShare: orgShare,
            organizationId: params.organizationId,
            apexShare: apexShare,
            apexOrgId: params.apexOrgId,
        });
        const saved = await this.ledgerRepo.save(record);
        await this.creditPot(status_enum_1.PotType.PLATFORM, 'PLATFORM', platformShare);
        await this.creditPot(status_enum_1.PotType.ADMIN, 'ADMIN', superAdminShare);
        if (params.organizationId) {
            await this.creditPot(status_enum_1.PotType.ORGANIZATION, params.organizationId, orgShare);
        }
        if (params.apexOrgId) {
            await this.creditPot(status_enum_1.PotType.APEX, params.apexOrgId, apexShare);
        }
        return saved;
    }
    async creditPot(potType, entityId, amount) {
        const existing = await this.potRepo.findOne({
            where: { potType, entityId },
        });
        if (existing) {
            existing.balance = Number(existing.balance) + amount;
            await this.potRepo.save(existing);
        }
        else {
            await this.potRepo.save(this.potRepo.create({ potType, entityId, balance: amount }));
        }
    }
    async getFeeShareLedger() {
        return this.ledgerRepo.find({ order: { createdAt: 'DESC' }, take: 100 });
    }
    async hasRegistrationRecord(paymentId) {
        const existing = await this.ledgerRepo.findOne({
            where: { paymentId, source: status_enum_1.FeeSource.REGISTRATION },
        });
        return !!existing;
    }
    async getScopedFeeSummary(ctx) {
        if (ctx.organizationId) {
            const [ledger, pot] = await Promise.all([
                this.ledgerRepo.find({
                    where: { organizationId: ctx.organizationId },
                    order: { createdAt: 'DESC' },
                    take: 50,
                }),
                this.potRepo.findOne({
                    where: { potType: status_enum_1.PotType.ORGANIZATION, entityId: ctx.organizationId },
                }),
            ]);
            const registrationShare = ledger
                .filter((l) => l.source === status_enum_1.FeeSource.REGISTRATION)
                .reduce((s, l) => s + Number(l.organizationShare), 0);
            const bnplShare = ledger
                .filter((l) => l.source !== status_enum_1.FeeSource.REGISTRATION)
                .reduce((s, l) => s + Number(l.organizationShare), 0);
            return {
                scope: 'organization',
                organizationId: ctx.organizationId,
                potBalance: pot ? Number(pot.balance) : 0,
                totalFees: ledger.reduce((s, l) => s + Number(l.totalFee), 0),
                organizationShare: ledger.reduce((s, l) => s + Number(l.organizationShare), 0),
                registrationShare,
                bnplShare,
                recentLedger: ledger.slice(0, 10),
            };
        }
        if (ctx.apexOrgId) {
            const [ledger, pot] = await Promise.all([
                this.ledgerRepo.find({
                    where: { apexOrgId: ctx.apexOrgId },
                    order: { createdAt: 'DESC' },
                    take: 50,
                }),
                this.potRepo.findOne({
                    where: { potType: status_enum_1.PotType.APEX, entityId: ctx.apexOrgId },
                }),
            ]);
            return {
                scope: 'apex',
                apexOrgId: ctx.apexOrgId,
                potBalance: pot ? Number(pot.balance) : 0,
                totalFees: ledger.reduce((s, l) => s + Number(l.totalFee), 0),
                apexShare: ledger.reduce((s, l) => s + Number(l.apexShare), 0),
                recentLedger: ledger.slice(0, 10),
            };
        }
        return {
            scope: 'none',
            potBalance: 0,
            totalFees: 0,
            organizationShare: 0,
            registrationShare: 0,
            bnplShare: 0,
            recentLedger: [],
        };
    }
    async getPots() {
        return this.potRepo.find({ order: { updatedAt: 'DESC' } });
    }
    async listBanks() {
        return this.paystackClient.listBanks();
    }
    async withdrawShare(ctx) {
        let potType;
        let entityId;
        let bank = null;
        if (ctx.role === role_enum_1.Role.APEX_BUSINESS_MANAGER && ctx.apexOrgId) {
            const apexOrg = await this.apexOrgRepo.findOne({ where: { id: ctx.apexOrgId } });
            if (!apexOrg?.accountNumber) {
                throw new common_1.BadRequestException('Apex organization must store bank account details before withdrawing');
            }
            bank = {
                bankName: apexOrg.bankName,
                accountName: apexOrg.accountName,
                accountNumber: apexOrg.accountNumber,
                bankCode: apexOrg.bankCode,
            };
            potType = status_enum_1.PotType.APEX;
            entityId = ctx.apexOrgId;
        }
        else if (ctx.role === role_enum_1.Role.BUSINESS_MANAGER && ctx.organizationId) {
            const org = await this.orgRepo.findOne({ where: { id: ctx.organizationId } });
            if (!org?.accountNumber) {
                throw new common_1.BadRequestException('Organization must store a bank account before withdrawing');
            }
            bank = {
                bankName: org.bankName,
                accountName: org.accountName,
                accountNumber: org.accountNumber,
                bankCode: org.bankCode,
            };
            potType = status_enum_1.PotType.ORGANIZATION;
            entityId = ctx.organizationId;
        }
        else {
            potType = status_enum_1.PotType.BUSINESS_MANAGER;
            entityId = ctx.userId;
        }
        const lockKey = this.potLockKey(potType, entityId);
        if (this.payoutInFlight.has(lockKey)) {
            throw new common_1.BadRequestException('A payout for this pot is already being processed — please wait');
        }
        this.payoutInFlight.add(lockKey);
        try {
            const pot = await this.potRepo.findOne({ where: { potType, entityId } });
            if (!pot || Number(pot.balance) <= 0) {
                return { withdrawn: 0, remaining: 0 };
            }
            const amount = Number(pot.balance);
            const request = this.withdrawalRepo.create({
                potType,
                amount,
                status: status_enum_1.PayoutStatus.PENDING,
                requestedBy: ctx.userId,
                accountNumber: bank?.accountNumber,
                bankCode: bank?.bankCode,
                bankName: bank?.bankName,
                note: 'Registration fee withdrawal — auto-processed via Paystack balance',
            });
            const savedRequest = await this.withdrawalRepo.save(request);
            const reference = `TFR-${savedRequest.id}`;
            savedRequest.paystackReference = reference;
            await this.withdrawalRepo.save(savedRequest);
            try {
                const recipientCode = await this.paystackClient.createTransferRecipient({
                    name: bank?.accountName || 'Coop Beneficiary',
                    accountNumber: bank?.accountNumber || '',
                    bankCode: bank?.bankCode || '',
                });
                const transfer = await this.paystackClient.initiateTransfer({
                    amount,
                    recipient: recipientCode,
                    reason: `${potType} registration fee share withdrawal`,
                    reference,
                });
                savedRequest.status = status_enum_1.PayoutStatus.COMPLETED;
                savedRequest.approvedBy = ctx.userId;
                savedRequest.paystackReference = transfer.reference;
                savedRequest.note = `Auto-paid via Paystack balance (ref: ${transfer.reference})`;
                await this.withdrawalRepo.save(savedRequest);
                pot.balance = 0;
                await this.potRepo.save(pot);
                this.logger.log(`Auto-paid ${potType} pot ${entityId} ₦${amount} via Paystack transfer ${transfer.reference}`);
                return { withdrawn: amount, remaining: 0 };
            }
            catch (error) {
                const settled = await this.settleAmbiguousOutcome(savedRequest, pot, reference, error instanceof Error ? error.message : 'unknown error', ctx.userId);
                if (settled) {
                    this.logger.warn(`Payout for ${potType} pot ${entityId} (${reference}) recorded as settled after verify`);
                    return { withdrawn: amount, remaining: 0 };
                }
                this.logger.error(`Auto-payout failed for ${potType} pot ${entityId}: ${error.message}`);
                throw new common_1.BadRequestException('Payout failed — fee balance retained, you can retry');
            }
        }
        finally {
            this.payoutInFlight.delete(lockKey);
        }
    }
    async withdrawAdmin(dto) {
        if (!dto.accountNumber || !dto.bankCode || !dto.bankName) {
            throw new common_1.BadRequestException('Destination account details are required to withdraw from the admin pot');
        }
        const lockKey = this.potLockKey(status_enum_1.PotType.ADMIN, 'ADMIN');
        if (this.payoutInFlight.has(lockKey)) {
            throw new common_1.BadRequestException('A payout for this pot is already being processed — please wait');
        }
        this.payoutInFlight.add(lockKey);
        try {
            const pot = await this.potRepo.findOne({ where: { potType: status_enum_1.PotType.ADMIN, entityId: 'ADMIN' } });
            if (!pot || Number(pot.balance) <= 0) {
                throw new common_1.BadRequestException('Admin pot is empty');
            }
            const amount = Number(pot.balance);
            const request = this.withdrawalRepo.create({
                potType: status_enum_1.PotType.ADMIN,
                amount,
                status: status_enum_1.PayoutStatus.PENDING,
                requestedBy: dto.userId,
                approvedBy: dto.userId,
                accountNumber: dto.accountNumber,
                bankCode: dto.bankCode,
                bankName: dto.bankName,
                note: 'Admin pot withdrawal — processed by super admin',
            });
            const savedRequest = await this.withdrawalRepo.save(request);
            const reference = `TFR-${savedRequest.id}`;
            savedRequest.paystackReference = reference;
            await this.withdrawalRepo.save(savedRequest);
            try {
                const recipientCode = await this.paystackClient.createTransferRecipient({
                    name: dto.bankName || 'Coop Admin Beneficiary',
                    accountNumber: dto.accountNumber,
                    bankCode: dto.bankCode,
                });
                const transfer = await this.paystackClient.initiateTransfer({
                    amount,
                    recipient: recipientCode,
                    reason: 'Admin pot withdrawal',
                    reference,
                });
                savedRequest.status = status_enum_1.PayoutStatus.COMPLETED;
                savedRequest.paystackReference = transfer.reference;
                savedRequest.note = `Paid via Paystack balance (ref: ${transfer.reference})`;
                await this.withdrawalRepo.save(savedRequest);
                pot.balance = 0;
                await this.potRepo.save(pot);
                this.logger.log(`Admin pot paid ₦${amount} via Paystack transfer ${transfer.reference}`);
                return savedRequest;
            }
            catch (error) {
                const settled = await this.settleAmbiguousOutcome(savedRequest, pot, reference, error instanceof Error ? error.message : 'unknown error', dto.userId);
                if (settled) {
                    this.logger.warn(`Admin payout ${reference} recorded as settled after verify`);
                    return savedRequest;
                }
                this.logger.error(`Admin payout failed: ${error.message}`);
                throw new common_1.BadRequestException('Admin payout failed — fee balance retained, you can retry');
            }
        }
        finally {
            this.payoutInFlight.delete(lockKey);
        }
    }
    async requestPlatformWithdrawal(userId, dto) {
        const pot = await this.potRepo.findOne({ where: { potType: status_enum_1.PotType.PLATFORM, entityId: 'PLATFORM' } });
        if (!pot || Number(pot.balance) <= 0) {
            throw new common_1.BadRequestException('Platform pot is empty');
        }
        const existing = await this.withdrawalRepo.findOne({ where: { potType: status_enum_1.PotType.PLATFORM, status: status_enum_1.PayoutStatus.PENDING } });
        if (existing) {
            throw new common_1.BadRequestException('A pending platform withdrawal request already exists');
        }
        return this.withdrawalRepo.save(this.withdrawalRepo.create({
            potType: status_enum_1.PotType.PLATFORM,
            amount: Number(pot.balance),
            status: status_enum_1.PayoutStatus.PENDING,
            requestedBy: userId,
            accountNumber: dto?.accountNumber,
            bankCode: dto?.bankCode,
            bankName: dto?.bankName,
            note: 'Platform pot withdrawal request — pending super admin approval',
        }));
    }
    async getWithdrawalRequests() {
        return this.withdrawalRepo.find({ order: { createdAt: 'DESC' } });
    }
    async approveWithdrawal(id, approvedBy, dto) {
        const req = await this.withdrawalRepo.findOne({ where: { id } });
        if (!req)
            throw new common_1.NotFoundException('Withdrawal request not found');
        if (req.status !== status_enum_1.PayoutStatus.PENDING)
            throw new common_1.BadRequestException('Request is not pending');
        if (dto?.accountNumber)
            req.accountNumber = dto.accountNumber;
        if (dto?.bankCode)
            req.bankCode = dto.bankCode;
        if (dto?.bankName)
            req.bankName = dto.bankName;
        if (!req.accountNumber || !req.bankCode) {
            throw new common_1.BadRequestException('Destination account details are required to approve the platform withdrawal');
        }
        const lockKey = this.potLockKey(status_enum_1.PotType.PLATFORM, 'PLATFORM');
        if (this.payoutInFlight.has(lockKey)) {
            throw new common_1.BadRequestException('A payout for this pot is already being processed — please wait');
        }
        this.payoutInFlight.add(lockKey);
        try {
            const pot = await this.potRepo.findOne({ where: { potType: status_enum_1.PotType.PLATFORM, entityId: 'PLATFORM' } });
            if (!pot || Number(pot.balance) <= 0) {
                throw new common_1.BadRequestException('Platform pot is empty');
            }
            const amount = Number(pot.balance);
            const reference = req.paystackReference || `TFR-${req.id}`;
            req.paystackReference = reference;
            await this.withdrawalRepo.save(req);
            try {
                const recipientCode = await this.paystackClient.createTransferRecipient({
                    name: req.bankName || 'Coop Platform Beneficiary',
                    accountNumber: req.accountNumber,
                    bankCode: req.bankCode,
                });
                const transfer = await this.paystackClient.initiateTransfer({
                    amount,
                    recipient: recipientCode,
                    reason: 'Platform pot withdrawal',
                    reference,
                });
                req.status = status_enum_1.PayoutStatus.COMPLETED;
                req.approvedBy = approvedBy;
                req.amount = amount;
                req.paystackReference = transfer.reference;
                req.note = `Paid via Paystack balance (ref: ${transfer.reference})`;
                await this.withdrawalRepo.save(req);
                pot.balance = 0;
                await this.potRepo.save(pot);
                this.logger.log(`Platform pot paid ₦${amount} via Paystack transfer ${transfer.reference}`);
                return req;
            }
            catch (error) {
                const settled = await this.settleAmbiguousOutcome(req, pot, reference, error instanceof Error ? error.message : 'unknown error', approvedBy);
                if (settled) {
                    this.logger.warn(`Platform payout ${reference} recorded as settled after verify`);
                    return req;
                }
                this.logger.error(`Platform payout failed for request ${id}: ${error.message}`);
                throw new common_1.BadRequestException('Platform payout failed — pot balance retained, you can retry');
            }
        }
        finally {
            this.payoutInFlight.delete(lockKey);
        }
    }
    async rejectWithdrawal(id) {
        const req = await this.withdrawalRepo.findOne({ where: { id } });
        if (!req)
            throw new common_1.NotFoundException('Withdrawal request not found');
        if (req.status !== status_enum_1.PayoutStatus.PENDING)
            throw new common_1.BadRequestException('Request is not pending');
        req.status = status_enum_1.PayoutStatus.FAILED;
        await this.withdrawalRepo.save(req);
        return req;
    }
};
exports.FeeShareService = FeeShareService;
exports.FeeShareService = FeeShareService = FeeShareService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(fee_share_ledger_entity_1.FeeShareLedger)),
    __param(1, (0, typeorm_1.InjectRepository)(fee_pot_entity_1.FeePot)),
    __param(2, (0, typeorm_1.InjectRepository)(fee_withdrawal_request_entity_1.FeeWithdrawalRequest)),
    __param(3, (0, typeorm_1.InjectRepository)(organization_entity_1.Organization)),
    __param(4, (0, typeorm_1.InjectRepository)(apex_organization_entity_1.ApexOrganization)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        settings_service_1.SettingsService,
        paystack_client_1.PaystackClient])
], FeeShareService);
//# sourceMappingURL=fee-share.service.js.map