import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FeeShareLedger } from '../entities/fee-share-ledger.entity';
import { FeePot } from '../entities/fee-pot.entity';
import { FeeWithdrawalRequest } from '../entities/fee-withdrawal-request.entity';
import { PotType, FeeSource, PayoutStatus } from '../../../common/enums/status.enum';
import { Role } from '../../../common/enums/role.enum';
import { SettingsService } from '../../settings/settings.service';
import { Organization } from '../../organizations/entities/organization.entity';
import { ApexOrganization } from '../../apex-organizations/entities/apex-organization.entity';
import { PaystackClient, PaystackTransferResult } from '../../payments/providers/paystack/paystack.client';

@Injectable()
export class FeeShareService {
  private readonly logger = new Logger(FeeShareService.name);
  private readonly payoutInFlight = new Set<string>();

  constructor(
    @InjectRepository(FeeShareLedger)
    private readonly ledgerRepo: Repository<FeeShareLedger>,
    @InjectRepository(FeePot)
    private readonly potRepo: Repository<FeePot>,
    @InjectRepository(FeeWithdrawalRequest)
    private readonly withdrawalRepo: Repository<FeeWithdrawalRequest>,
    @InjectRepository(Organization)
    private readonly orgRepo: Repository<Organization>,
    @InjectRepository(ApexOrganization)
    private readonly apexOrgRepo: Repository<ApexOrganization>,
    private readonly settingsService: SettingsService,
    private readonly paystackClient: PaystackClient,
  ) {}

  private potLockKey(potType: PotType, entityId: string): string {
    return `${potType}:${entityId}`;
  }

  private async settleAmbiguousOutcome(
    request: FeeWithdrawalRequest,
    pot: FeePot,
    reference: string,
    errorMessage: string,
    actorId: string,
  ): Promise<boolean> {
    let verified: PaystackTransferResult | null = null;
    try {
      verified = await this.paystackClient.verifyTransfer(reference);
    } catch (error: unknown) {
      this.logger.error(
        `Could not verify transfer ${reference}: ${(error as Error).message}`,
      );
      verified = null;
    }

    if (verified && (verified.status === 'failed' || verified.status === 'reversed')) {
      request.status = PayoutStatus.FAILED;
      request.paystackReference = verified.reference;
      request.note = `Payout failed: ${errorMessage}`;
      await this.withdrawalRepo.save(request);
      return false;
    }

    if (verified) {
      request.status = PayoutStatus.COMPLETED;
      request.approvedBy = actorId;
      request.paystackReference = verified.reference;
      request.note = `Auto-paid via Paystack balance (ref: ${verified.reference})`;
    } else {
      request.status = PayoutStatus.COMPLETED;
      request.approvedBy = actorId;
      request.paystackReference = reference;
      request.note = 'Payout status uncertain — verify on Paystack dashboard before any retry';
    }
    await this.withdrawalRepo.save(request);
    pot.balance = 0;
    await this.potRepo.save(pot);
    return true;
  }

  async recordRegistrationFee(params: {
    paymentId: string;
    totalFee: number;
    organizationId?: string;
    apexOrgId?: string;
  }): Promise<FeeShareLedger> {
    const existing = await this.ledgerRepo.findOne({
      where: { paymentId: params.paymentId, source: FeeSource.REGISTRATION },
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
      source: FeeSource.REGISTRATION,
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

    await this.creditPot(PotType.PLATFORM, 'PLATFORM', platformShare);
    await this.creditPot(PotType.ADMIN, 'ADMIN', superAdminShare);
    if (params.organizationId) {
      await this.creditPot(PotType.ORGANIZATION, params.organizationId, orgShare);
    }
    if (params.apexOrgId) {
      await this.creditPot(PotType.APEX, params.apexOrgId, apexShare);
    }

    return saved;
  }

  async creditPot(
    potType: PotType,
    entityId: string,
    amount: number,
  ): Promise<void> {
    const existing = await this.potRepo.findOne({
      where: { potType, entityId },
    });
    if (existing) {
      existing.balance = Number(existing.balance) + amount;
      await this.potRepo.save(existing);
    } else {
      await this.potRepo.save(
        this.potRepo.create({ potType, entityId, balance: amount }),
      );
    }
  }

  async getFeeShareLedger(): Promise<FeeShareLedger[]> {
    return this.ledgerRepo.find({ order: { createdAt: 'DESC' }, take: 100 });
  }

  async hasRegistrationRecord(paymentId: string): Promise<boolean> {
    const existing = await this.ledgerRepo.findOne({
      where: { paymentId, source: FeeSource.REGISTRATION },
    });
    return !!existing;
  }

  async getScopedFeeSummary(ctx: {
    organizationId?: string;
    apexOrgId?: string;
  }) {
    if (ctx.organizationId) {
      const [ledger, pot] = await Promise.all([
        this.ledgerRepo.find({
          where: { organizationId: ctx.organizationId },
          order: { createdAt: 'DESC' },
          take: 50,
        }),
        this.potRepo.findOne({
          where: { potType: PotType.ORGANIZATION, entityId: ctx.organizationId },
        }),
      ]);

      const registrationShare = ledger
        .filter((l) => l.source === FeeSource.REGISTRATION)
        .reduce((s, l) => s + Number(l.organizationShare), 0);
      const bnplShare = ledger
        .filter((l) => l.source !== FeeSource.REGISTRATION)
        .reduce((s, l) => s + Number(l.organizationShare), 0);

      return {
        scope: 'organization',
        organizationId: ctx.organizationId,
        potBalance: pot ? Number(pot.balance) : 0,
        totalFees: ledger.reduce((s, l) => s + Number(l.totalFee), 0),
        organizationShare: ledger.reduce(
          (s, l) => s + Number(l.organizationShare),
          0,
        ),
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
          where: { potType: PotType.APEX, entityId: ctx.apexOrgId },
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

  async getPots(): Promise<FeePot[]> {
    return this.potRepo.find({ order: { updatedAt: 'DESC' } });
  }

  async listBanks() {
    return this.paystackClient.listBanks();
  }

  async withdrawShare(ctx: {
    userId: string;
    role: string;
    organizationId?: string;
    apexOrgId?: string;
  }): Promise<{ withdrawn: number; remaining: number }> {
    let potType: PotType;
    let entityId: string;
    let bank: { bankName?: string; accountName?: string; accountNumber?: string; bankCode?: string } | null = null;

    if (ctx.role === Role.APEX_BUSINESS_MANAGER && ctx.apexOrgId) {
      const apexOrg = await this.apexOrgRepo.findOne({ where: { id: ctx.apexOrgId } });
      if (!apexOrg?.accountNumber) {
        throw new BadRequestException('Apex organization must store bank account details before withdrawing');
      }
      bank = {
        bankName: apexOrg.bankName,
        accountName: apexOrg.accountName,
        accountNumber: apexOrg.accountNumber,
        bankCode: apexOrg.bankCode,
      };
      potType = PotType.APEX;
      entityId = ctx.apexOrgId;
    } else if (ctx.role === Role.BUSINESS_MANAGER && ctx.organizationId) {
      const org = await this.orgRepo.findOne({ where: { id: ctx.organizationId } });
      if (!org?.accountNumber) {
        throw new BadRequestException('Organization must store a bank account before withdrawing');
      }
      bank = {
        bankName: org.bankName,
        accountName: org.accountName,
        accountNumber: org.accountNumber,
        bankCode: org.bankCode,
      };
      potType = PotType.ORGANIZATION;
      entityId = ctx.organizationId;
    } else {
      potType = PotType.BUSINESS_MANAGER;
      entityId = ctx.userId;
    }

    const lockKey = this.potLockKey(potType, entityId);
    if (this.payoutInFlight.has(lockKey)) {
      throw new BadRequestException('A payout for this pot is already being processed — please wait');
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
        status: PayoutStatus.PENDING,
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

        savedRequest.status = PayoutStatus.COMPLETED;
        savedRequest.approvedBy = ctx.userId;
        savedRequest.paystackReference = transfer.reference;
        savedRequest.note = `Auto-paid via Paystack balance (ref: ${transfer.reference})`;
        await this.withdrawalRepo.save(savedRequest);

        pot.balance = 0;
        await this.potRepo.save(pot);

        this.logger.log(
          `Auto-paid ${potType} pot ${entityId} ₦${amount} via Paystack transfer ${transfer.reference}`,
        );
        return { withdrawn: amount, remaining: 0 };
      } catch (error: unknown) {
        const settled = await this.settleAmbiguousOutcome(
          savedRequest,
          pot,
          reference,
          error instanceof Error ? error.message : 'unknown error',
          ctx.userId,
        );
        if (settled) {
          this.logger.warn(
            `Payout for ${potType} pot ${entityId} (${reference}) recorded as settled after verify`,
          );
          return { withdrawn: amount, remaining: 0 };
        }
        this.logger.error(`Auto-payout failed for ${potType} pot ${entityId}: ${(error as Error).message}`);
        throw new BadRequestException('Payout failed — fee balance retained, you can retry');
      }
    } finally {
      this.payoutInFlight.delete(lockKey);
    }
  }

  async withdrawAdmin(dto: {
    accountNumber: string;
    bankCode: string;
    bankName: string;
    userId: string;
  }): Promise<FeeWithdrawalRequest> {
    if (!dto.accountNumber || !dto.bankCode || !dto.bankName) {
      throw new BadRequestException('Destination account details are required to withdraw from the admin pot');
    }

    const lockKey = this.potLockKey(PotType.ADMIN, 'ADMIN');
    if (this.payoutInFlight.has(lockKey)) {
      throw new BadRequestException('A payout for this pot is already being processed — please wait');
    }
    this.payoutInFlight.add(lockKey);
    try {
      const pot = await this.potRepo.findOne({ where: { potType: PotType.ADMIN, entityId: 'ADMIN' } });
      if (!pot || Number(pot.balance) <= 0) {
        throw new BadRequestException('Admin pot is empty');
      }
      const amount = Number(pot.balance);

      const request = this.withdrawalRepo.create({
        potType: PotType.ADMIN,
        amount,
        status: PayoutStatus.PENDING,
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

        savedRequest.status = PayoutStatus.COMPLETED;
        savedRequest.paystackReference = transfer.reference;
        savedRequest.note = `Paid via Paystack balance (ref: ${transfer.reference})`;
        await this.withdrawalRepo.save(savedRequest);

        pot.balance = 0;
        await this.potRepo.save(pot);

        this.logger.log(`Admin pot paid ₦${amount} via Paystack transfer ${transfer.reference}`);
        return savedRequest;
      } catch (error: unknown) {
        const settled = await this.settleAmbiguousOutcome(
          savedRequest,
          pot,
          reference,
          error instanceof Error ? error.message : 'unknown error',
          dto.userId,
        );
        if (settled) {
          this.logger.warn(`Admin payout ${reference} recorded as settled after verify`);
          return savedRequest;
        }
        this.logger.error(`Admin payout failed: ${(error as Error).message}`);
        throw new BadRequestException('Admin payout failed — fee balance retained, you can retry');
      }
    } finally {
      this.payoutInFlight.delete(lockKey);
    }
  }

  async requestPlatformWithdrawal(
    userId: string,
    dto?: { accountNumber?: string; bankCode?: string; bankName?: string },
  ): Promise<FeeWithdrawalRequest> {
    const pot = await this.potRepo.findOne({ where: { potType: PotType.PLATFORM, entityId: 'PLATFORM' } });
    if (!pot || Number(pot.balance) <= 0) {
      throw new BadRequestException('Platform pot is empty');
    }

    const existing = await this.withdrawalRepo.findOne({ where: { potType: PotType.PLATFORM, status: PayoutStatus.PENDING } });
    if (existing) {
      throw new BadRequestException('A pending platform withdrawal request already exists');
    }

    return this.withdrawalRepo.save(
      this.withdrawalRepo.create({
        potType: PotType.PLATFORM,
        amount: Number(pot.balance),
        status: PayoutStatus.PENDING,
        requestedBy: userId,
        accountNumber: dto?.accountNumber,
        bankCode: dto?.bankCode,
        bankName: dto?.bankName,
        note: 'Platform pot withdrawal request — pending super admin approval',
      }),
    );
  }

  async getWithdrawalRequests(): Promise<FeeWithdrawalRequest[]> {
    return this.withdrawalRepo.find({ order: { createdAt: 'DESC' } });
  }

  async approveWithdrawal(
    id: string,
    approvedBy: string,
    dto?: { accountNumber?: string; bankCode?: string; bankName?: string },
  ): Promise<FeeWithdrawalRequest> {
    const req = await this.withdrawalRepo.findOne({ where: { id } });
    if (!req) throw new NotFoundException('Withdrawal request not found');
    if (req.status !== PayoutStatus.PENDING) throw new BadRequestException('Request is not pending');

    if (dto?.accountNumber) req.accountNumber = dto.accountNumber;
    if (dto?.bankCode) req.bankCode = dto.bankCode;
    if (dto?.bankName) req.bankName = dto.bankName;

    if (!req.accountNumber || !req.bankCode) {
      throw new BadRequestException('Destination account details are required to approve the platform withdrawal');
    }

    const lockKey = this.potLockKey(PotType.PLATFORM, 'PLATFORM');
    if (this.payoutInFlight.has(lockKey)) {
      throw new BadRequestException('A payout for this pot is already being processed — please wait');
    }
    this.payoutInFlight.add(lockKey);
    try {
      const pot = await this.potRepo.findOne({ where: { potType: PotType.PLATFORM, entityId: 'PLATFORM' } });
      if (!pot || Number(pot.balance) <= 0) {
        throw new BadRequestException('Platform pot is empty');
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

        req.status = PayoutStatus.COMPLETED;
        req.approvedBy = approvedBy;
        req.amount = amount;
        req.paystackReference = transfer.reference;
        req.note = `Paid via Paystack balance (ref: ${transfer.reference})`;
        await this.withdrawalRepo.save(req);

        pot.balance = 0;
        await this.potRepo.save(pot);

        this.logger.log(`Platform pot paid ₦${amount} via Paystack transfer ${transfer.reference}`);
        return req;
      } catch (error: unknown) {
        const settled = await this.settleAmbiguousOutcome(
          req,
          pot,
          reference,
          error instanceof Error ? error.message : 'unknown error',
          approvedBy,
        );
        if (settled) {
          this.logger.warn(`Platform payout ${reference} recorded as settled after verify`);
          return req;
        }
        this.logger.error(`Platform payout failed for request ${id}: ${(error as Error).message}`);
        throw new BadRequestException('Platform payout failed — pot balance retained, you can retry');
      }
    } finally {
      this.payoutInFlight.delete(lockKey);
    }
  }

  async rejectWithdrawal(id: string): Promise<FeeWithdrawalRequest> {
    const req = await this.withdrawalRepo.findOne({ where: { id } });
    if (!req) throw new NotFoundException('Withdrawal request not found');
    if (req.status !== PayoutStatus.PENDING) throw new BadRequestException('Request is not pending');

    req.status = PayoutStatus.FAILED;
    await this.withdrawalRepo.save(req);
    return req;
  }
}
