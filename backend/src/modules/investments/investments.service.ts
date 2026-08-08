import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { InvestmentProduct, InvestmentType, RiskTier, ProductStatus, DistributionFrequency, VALID_LIFECYCLE_TRANSITIONS } from './entities/investment-product.entity';
import { InvestmentProductVersion } from './entities/investment-product-version.entity';
import { InvestmentEligibilityRule, KycLevel } from './entities/investment-eligibility-rule.entity';
import { ShareIssuanceCycle, CycleStatus } from './entities/share-issuance-cycle.entity';
import { InvestmentOrder, OrderStatus } from './entities/investment-order.entity';
import { InvestmentHolding } from './entities/investment-holding.entity';
import { Distribution, DistributionType, DistributionStatus } from './entities/distribution.entity';
import { DistributionPayment } from './entities/distribution-payment.entity';
import { DistributionRun, DistRunStatus } from './entities/distribution-run.entity';
import { RedemptionRequest, RedemptionStatus } from './entities/redemption-request.entity';
import { PricingConfig, PricingFormula, NavSchedule, AccrualMethod } from './entities/pricing-config.entity';
import { NavSnapshot } from './entities/nav-snapshot.entity';
import { CorporateAction, CorporateActionType, CorporateActionStatus } from './entities/corporate-action.entity';
import { Payment } from '../payments/entities/payment.entity';
import { PaymentStatus, KycStatus } from '../../common/enums/status.enum';
import { UsersService } from '../users/users.service';

@Injectable()
export class InvestmentsService {
  constructor(
    private readonly usersService: UsersService,
    @InjectRepository(InvestmentProduct)
    private readonly productRepo: Repository<InvestmentProduct>,
    @InjectRepository(InvestmentProductVersion)
    private readonly versionRepo: Repository<InvestmentProductVersion>,
    @InjectRepository(InvestmentOrder)
    private readonly orderRepo: Repository<InvestmentOrder>,
    @InjectRepository(InvestmentHolding)
    private readonly holdingRepo: Repository<InvestmentHolding>,
    @InjectRepository(Distribution)
    private readonly distRepo: Repository<Distribution>,
    @InjectRepository(DistributionPayment)
    private readonly distPayRepo: Repository<DistributionPayment>,
    @InjectRepository(InvestmentEligibilityRule)
    private readonly eligibilityRepo: Repository<InvestmentEligibilityRule>,
    @InjectRepository(ShareIssuanceCycle)
    private readonly cycleRepo: Repository<ShareIssuanceCycle>,
    @InjectRepository(RedemptionRequest)
    private readonly redemptionRepo: Repository<RedemptionRequest>,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(PricingConfig)
    private readonly pricingRepo: Repository<PricingConfig>,
    @InjectRepository(NavSnapshot)
    private readonly navRepo: Repository<NavSnapshot>,
    @InjectRepository(CorporateAction)
    private readonly corpActionRepo: Repository<CorporateAction>,
    @InjectRepository(DistributionRun)
    private readonly distRunRepo: Repository<DistributionRun>,
  ) {}

  async listProducts(filters?: { type?: string; riskTier?: string; isOpen?: boolean }) {
    const where: any = { status: ProductStatus.ACTIVE };
    if (filters?.type) where.type = filters.type;
    if (filters?.riskTier) where.riskTier = filters.riskTier;
    if (filters?.isOpen !== undefined) where.isOpen = filters.isOpen;
    return this.productRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  async getProduct(id: string) {
    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) throw new NotFoundException('Investment product not found');
    return product;
  }

  async placeOrder(userId: string, dto: { productId: string; amount: number }) {
    const product = await this.getProduct(dto.productId);
    if (!product.isOpen) throw new BadRequestException('Investment product is not open');

    if (dto.amount < Number(product.minimumInvestment)) {
      throw new BadRequestException(`Minimum investment is ${product.minimumInvestment}`);
    }
    if (product.maximumInvestment && dto.amount > Number(product.maximumInvestment)) {
      throw new BadRequestException(`Maximum investment is ${product.maximumInvestment}`);
    }

    const eligibility = await this.checkFullEligibility(userId, dto.productId);
    if (!eligibility.allowed) {
      const reasons = eligibility.reasons.filter((r) => !r.passed).map((r) => r.label).join(', ');
      throw new BadRequestException(`Not eligible: ${reasons}`);
    }

    const pricingConfig = await this.pricingRepo.findOne({ where: { productId: dto.productId } });
    let unitPrice = Number(product.unitPrice) || 1;
    if (pricingConfig?.formulaType === PricingFormula.NAV_BASED) {
      const latestNav = await this.getLatestNavSnapshot(dto.productId);
      if (latestNav) unitPrice = Number(latestNav.unitPrice);
    }
    if (pricingConfig?.minUnitPrice) unitPrice = Math.max(unitPrice, Number(pricingConfig.minUnitPrice));
    if (pricingConfig?.maxUnitPrice) unitPrice = Math.min(unitPrice, Number(pricingConfig.maxUnitPrice));

    const fee = Math.round(dto.amount * Number(product.managementFeeRate) / 100 * 100) / 100;
    const units = Math.floor((dto.amount - fee) / unitPrice);

    const order = new InvestmentOrder();
    order.userId = userId;
    order.productId = dto.productId;
    order.amount = dto.amount;
    order.units = units;
    order.unitPrice = unitPrice;
    order.fee = fee;
    order.productVersion = product.version;
    order.status = OrderStatus.PLACED;
    return this.orderRepo.save(order);
  }

  async confirmPayment(orderId: string, paymentReference: string, paymentId: string) {
    const order = await this.orderRepo.findOne({ where: { id: orderId }, relations: { product: true } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== OrderStatus.PLACED) throw new BadRequestException('Order already processed');

    order.status = OrderStatus.PAYMENT_CONFIRMED;
    order.paymentReference = paymentReference;
    order.paymentId = paymentId;
    await this.orderRepo.save(order);

    const product = order.product;
    const lockedUntil = product.lockInDays > 0
      ? new Date(Date.now() + product.lockInDays * 86400000)
      : null;
    const maturityDate = product.tenorDays
      ? new Date(Date.now() + product.tenorDays * 86400000)
      : null;

    const holding = new InvestmentHolding();
    holding.userId = order.userId;
    holding.productId = order.productId;
    holding.orderId = order.id;
    holding.units = order.units ?? 0;
    holding.costBasis = order.amount;
    holding.currentValue = order.amount;
    holding.lockedUntil = lockedUntil;
    holding.maturityDate = maturityDate;
    holding.isLocked = !!lockedUntil;
    holding.isActive = true;
    await this.holdingRepo.save(holding);

    order.status = OrderStatus.ALLOCATED;
    await this.orderRepo.save(order);

    if (product.availableUnits !== null && product.availableUnits !== undefined) {
      product.availableUnits = Math.max(0, product.availableUnits - (order.units ?? 0));
    }
    if (product.totalCapacity) {
      product.currentCapacity = Math.min(Number(product.totalCapacity), (product.currentCapacity ?? 0) + order.amount);
    }
    if (product.availableUnits !== null || product.totalCapacity) {
      await this.productRepo.save(product);
    }

    return { order, holding };
  }

  async getMyOrders(userId: string) {
    return this.orderRepo.find({
      where: { userId },
      relations: { product: true },
      order: { createdAt: 'DESC' },
    });
  }

  async getMyHoldings(userId: string) {
    return this.holdingRepo.find({
      where: { userId, isActive: true },
      relations: { product: true },
      order: { createdAt: 'DESC' },
    });
  }

  async getPortfolioSummary(userId: string) {
    const holdings = await this.getMyHoldings(userId);
    const totalInvested = holdings.reduce((s, h) => s + Number(h.costBasis), 0);
    const currentValue = holdings.reduce((s, h) => s + Number(h.currentValue || 0), 0);
    const lockedValue = holdings.filter((h) => h.isLocked).reduce((s, h) => s + Number(h.currentValue || 0), 0);
    const availableValue = currentValue - lockedValue;

    const distPays = await this.distPayRepo.find({
      where: { userId, isPaid: true },
    });
    const totalEarned = distPays.reduce((s, p) => s + Number(p.amount), 0);
    const unrealizedReturn = currentValue - totalInvested;

    return {
      totalInvested,
      currentValue,
      unrealizedReturn,
      unrealizedReturnPct: totalInvested > 0 ? (unrealizedReturn / totalInvested) * 100 : 0,
      totalEarned,
      lockedValue,
      availableValue,
      holdingCount: holdings.length,
    };
  }

  async getDistributions(productId?: string) {
    const where: any = {};
    if (productId) where.productId = productId;
    return this.distRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  async getMyDistributionHistory(userId: string) {
    return this.distPayRepo.find({
      where: { userId },
      relations: { distribution: true },
      order: { createdAt: 'DESC' },
    });
  }

  async getPendingDistributions(userId: string) {
    return this.distPayRepo.find({
      where: { userId, isPaid: false },
      relations: { distribution: true },
      order: { createdAt: 'DESC' },
    });
  }

  async requestRedemption(userId: string, dto: { holdingId: string; units: number; reason?: string }) {
    const holding = await this.holdingRepo.findOne({ where: { id: dto.holdingId, userId, isActive: true }, relations: { product: true } });
    if (!holding) throw new NotFoundException('Holding not found');

    if (holding.isLocked && holding.lockedUntil && new Date(holding.lockedUntil) > new Date()) {
      throw new BadRequestException(`Holding is locked until ${holding.lockedUntil.toISOString().slice(0, 10)}`);
    }

    if (dto.units > holding.units) {
      throw new BadRequestException('Requested units exceed holding');
    }

    const amount = dto.units * (Number(holding.currentValue) / holding.units);

    const request = new RedemptionRequest();
    request.userId = userId;
    request.holdingId = dto.holdingId;
    request.units = dto.units;
    request.amount = Math.round(amount * 100) / 100;
    request.reason = dto.reason ?? null;
    request.status = RedemptionStatus.REQUESTED;
    return this.redemptionRepo.save(request);
  }

  // ── Admin: Product lifecycle ──

  async createProduct(dto: {
    name: string;
    description?: string;
    type: InvestmentType;
    riskTier?: RiskTier;
    minimumInvestment: number;
    maximumInvestment?: number;
    unitPrice?: number;
    lockInDays?: number;
    tenorDays?: number;
    managementFeeRate?: number;
    expectedReturnRate?: number;
    profitSharingRules?: string;
    distributionFrequency?: DistributionFrequency;
    totalUnits?: number;
    availableUnits?: number;
    createdBy: string;
  }) {
    const product = new InvestmentProduct();
    product.name = dto.name;
    product.description = dto.description || null;
    product.type = dto.type;
    product.riskTier = dto.riskTier || RiskTier.MEDIUM;
    product.minimumInvestment = dto.minimumInvestment;
    product.maximumInvestment = dto.maximumInvestment ?? null;
    product.unitPrice = dto.unitPrice ?? null;
    product.lockInDays = dto.lockInDays ?? 0;
    product.tenorDays = dto.tenorDays ?? null;
    product.managementFeeRate = dto.managementFeeRate ?? 0;
    product.expectedReturnRate = dto.expectedReturnRate ?? 0;
    product.profitSharingRules = dto.profitSharingRules || null;
    product.distributionFrequency = dto.distributionFrequency || DistributionFrequency.MATURITY;
    product.totalUnits = dto.totalUnits ?? null;
    product.availableUnits = dto.availableUnits ?? null;
    product.currentCapacity = 0;
    product.isOpen = true;
    product.status = ProductStatus.DRAFT;
    product.version = 1;
    product.createdBy = dto.createdBy;
    const saved = await this.productRepo.save(product);
    await this._snapshotVersion(saved, 'Initial creation', dto.createdBy);
    return saved;
  }

  async updateProduct(id: string, dto: Partial<{
    name: string;
    description: string;
    type: InvestmentType;
    riskTier: RiskTier;
    minimumInvestment: number;
    maximumInvestment: number;
    unitPrice: number;
    lockInDays: number;
    tenorDays: number;
    managementFeeRate: number;
    expectedReturnRate: number;
    profitSharingRules: string;
    distributionFrequency: DistributionFrequency;
    totalUnits: number;
    availableUnits: number;
    isOpen: boolean;
    changeSummary: string;
  }>, changedBy: string) {
    const product = await this.getProduct(id);
    Object.assign(product, dto);
    product.version += 1;
    const saved = await this.productRepo.save(product);
    await this._snapshotVersion(saved, dto.changeSummary || `Updated to v${saved.version}`, changedBy);
    return saved;
  }

  async setProductStatus(id: string, status: ProductStatus, changedBy: string) {
    const product = await this.getProduct(id);
    const allowed = VALID_LIFECYCLE_TRANSITIONS[product.status] || [];
    if (!allowed.includes(status)) {
      throw new BadRequestException(
        `Cannot transition from ${product.status} to ${status}. Allowed: ${allowed.join(', ') || 'none'}`,
      );
    }
    const oldStatus = product.status;
    product.status = status;
    product.version += 1;
    if (status === ProductStatus.CLOSED || status === ProductStatus.ARCHIVED) product.isOpen = false;
    if (status === ProductStatus.ACTIVE || status === ProductStatus.PENDING_REVIEW) product.isOpen = true;
    const saved = await this.productRepo.save(product);
    await this._snapshotVersion(saved, `Status changed: ${oldStatus} → ${status}`, changedBy);
    return saved;
  }

  async getProductVersions(id: string) {
    return this.versionRepo.find({
      where: { productId: id },
      order: { version: 'DESC' },
    });
  }

  async listAllProducts(filters?: { type?: string; riskTier?: string; status?: string }) {
    const where: any = {};
    if (filters?.type) where.type = filters.type;
    if (filters?.riskTier) where.riskTier = filters.riskTier;
    if (filters?.status) where.status = filters.status;
    return this.productRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  private async _snapshotVersion(product: InvestmentProduct, changeSummary: string, changedBy: string) {
    const version = new InvestmentProductVersion();
    version.productId = product.id;
    version.version = product.version;
    version.snapshot = {
      name: product.name,
      description: product.description,
      type: product.type,
      riskTier: product.riskTier,
      minimumInvestment: Number(product.minimumInvestment),
      maximumInvestment: product.maximumInvestment ? Number(product.maximumInvestment) : null,
      unitPrice: product.unitPrice ? Number(product.unitPrice) : null,
      lockInDays: product.lockInDays,
      tenorDays: product.tenorDays,
      managementFeeRate: Number(product.managementFeeRate),
      expectedReturnRate: Number(product.expectedReturnRate),
      profitSharingRules: product.profitSharingRules,
      distributionFrequency: product.distributionFrequency,
      totalUnits: product.totalUnits,
      availableUnits: product.availableUnits,
      isOpen: product.isOpen,
      status: product.status,
    };
    version.changeSummary = changeSummary;
    version.changedBy = changedBy;
    await this.versionRepo.save(version);
  }

  // ── Eligibility rules ──

  async getEligibilityRules(productId: string) {
    let rules = await this.eligibilityRepo.findOne({ where: { productId } });
    if (!rules) {
      const product = await this.getProduct(productId);
      rules = this.eligibilityRepo.create({ productId, kycRequiredLevel: KycLevel.BASIC });
      rules = await this.eligibilityRepo.save(rules);
    }
    return rules;
  }

  async updateEligibilityRules(productId: string, dto: Partial<{
    kycRequiredLevel: KycLevel;
    requireMembership: boolean;
    allowedGeographies: string[];
    accreditationRequired: boolean;
    investorWhitelist: string[];
    investorBlacklist: string[];
  }>) {
    const rules = await this.getEligibilityRules(productId);
    Object.assign(rules, dto);
    return this.eligibilityRepo.save(rules);
  }

  // ── Capacity controls ──

  async setCapacity(id: string, dto: { totalCapacity?: number; perInvestorCaps?: { min?: number; max?: number } }) {
    const product = await this.getProduct(id);
    if (dto.totalCapacity !== undefined) product.totalCapacity = dto.totalCapacity;
    if (dto.perInvestorCaps !== undefined) product.perInvestorCaps = dto.perInvestorCaps;
    return this.productRepo.save(product);
  }

  // ── Share issuance cycles ──

  async createIssuanceCycle(productId: string, dto: {
    cycleName: string;
    totalUnits: number;
    unitPrice: number;
    totalValue: number;
    openDate?: string;
    closeDate?: string;
    createdBy: string;
  }) {
    const product = await this.getProduct(productId);
    const cycle = new ShareIssuanceCycle();
    cycle.productId = productId;
    cycle.cycleName = dto.cycleName;
    cycle.totalUnits = dto.totalUnits;
    cycle.unitPrice = dto.unitPrice;
    cycle.totalValue = dto.totalValue;
    cycle.openDate = dto.openDate ? new Date(dto.openDate) : null;
    cycle.closeDate = dto.closeDate ? new Date(dto.closeDate) : null;
    cycle.createdBy = dto.createdBy;
    cycle.status = CycleStatus.PENDING;
    return this.cycleRepo.save(cycle);
  }

  async approveIssuanceCycle(cycleId: string, approvedBy: string) {
    const cycle = await this.cycleRepo.findOne({ where: { id: cycleId } });
    if (!cycle) throw new NotFoundException('Issuance cycle not found');
    if (cycle.status !== CycleStatus.PENDING) throw new BadRequestException('Cycle already processed');
    cycle.status = CycleStatus.APPROVED;
    cycle.approvedBy = approvedBy;
    cycle.approvedAt = new Date();
    return this.cycleRepo.save(cycle);
  }

  async getIssuanceCycles(productId: string) {
    return this.cycleRepo.find({
      where: { productId },
      order: { createdAt: 'DESC' },
    });
  }

  async listAllIssuanceCycles() {
    return this.cycleRepo.find({
      relations: { product: true },
      order: { createdAt: 'DESC' },
    });
  }

  // ── Whitelist/blacklist helpers ──

  async isInvestorAllowed(productId: string, userId: string): Promise<{ allowed: boolean; reason?: string }> {
    const rules = await this.eligibilityRepo.findOne({ where: { productId } });
    if (!rules) return { allowed: true };

    if (rules.investorBlacklist?.includes(userId)) {
      return { allowed: false, reason: 'Investor is blacklisted' };
    }

    if (rules.investorWhitelist?.length && !rules.investorWhitelist.includes(userId)) {
      return { allowed: false, reason: 'Investor is not whitelisted' };
    }

    return { allowed: true };
  }

  async checkFullEligibility(userId: string, productId: string) {
    const product = await this.getProduct(productId);
    const user = await this.usersService.findById(userId);
    const rules = await this.getEligibilityRules(productId);
    const reasons: Array<{ key: string; label: string; passed: boolean; detail?: string }> = [];

    const whitelistCheck = await this.isInvestorAllowed(productId, userId);
    reasons.push({
      key: 'access_list',
      label: 'Investor access',
      passed: whitelistCheck.allowed,
      detail: whitelistCheck.reason,
    });

    let kycOk = true;
    if (rules.kycRequiredLevel !== KycLevel.NONE) {
      const userKyc = user.kycStatus;
      kycOk = rules.kycRequiredLevel === KycLevel.ADVANCED
        ? userKyc === KycStatus.APPROVED
        : userKyc === KycStatus.APPROVED;
      reasons.push({
        key: 'kyc',
        label: `KYC level: ${rules.kycRequiredLevel}`,
        passed: kycOk,
        detail: kycOk ? undefined : `KYC status is ${userKyc}, required ${rules.kycRequiredLevel}`,
      });
    }

    const membershipOk = !rules.requireMembership || !!user.organizationId;
    reasons.push({
      key: 'membership',
      label: 'Organization membership',
      passed: membershipOk,
      detail: membershipOk ? undefined : 'Organization membership required',
    });

    const allowed = whitelistCheck.allowed && kycOk && membershipOk;
    return { allowed, reasons };
  }

  async getCompliance(userId: string, productId?: string) {
    const user = await this.usersService.findById(userId);
    const kycApproved = user.kycStatus === KycStatus.APPROVED;
    const requirements: Array<{ key: string; label: string; met: boolean; status?: string }> = [
      {
        key: 'kyc',
        label: 'KYC Verification',
        met: kycApproved,
        status: user.kycStatus,
      },
    ];

    if (productId) {
      const full = await this.checkFullEligibility(userId, productId);
      for (const r of full.reasons) {
        if (!requirements.find((x) => x.key === r.key)) {
          requirements.push({ key: r.key, label: r.label, met: r.passed, status: r.passed ? 'passed' : 'failed' });
        }
      }
      return {
        kycStatus: user.kycStatus,
        kycApproved,
        eligible: full.allowed,
        requirements,
      };
    }

    return {
      kycStatus: user.kycStatus,
      kycApproved,
      eligible: kycApproved,
      requirements,
    };
  }

  async getMyRedemptions(userId: string) {
    return this.redemptionRepo.find({
      where: { userId },
      relations: { holding: { product: true } },
      order: { createdAt: 'DESC' },
    });
  }

  async getInvestmentStatement(userId: string) {
    const [holdings, orders, distPays, redemptions] = await Promise.all([
      this.getMyHoldings(userId),
      this.getMyOrders(userId),
      this.getMyDistributionHistory(userId),
      this.getMyRedemptions(userId),
    ]);

    const portfolio = await this.getPortfolioSummary(userId);

    return {
      portfolio,
      holdings: holdings.map((h) => ({
        id: h.id,
        productName: h.product?.name || 'Unknown',
        units: h.units,
        costBasis: Number(h.costBasis),
        currentValue: Number(h.currentValue || 0),
        isLocked: h.isLocked,
        lockedUntil: h.lockedUntil,
        maturityDate: h.maturityDate,
        createdAt: h.createdAt,
      })),
      orders: orders.map((o) => ({
        id: o.id,
        productName: o.product?.name || 'Unknown',
        amount: Number(o.amount),
        units: o.units,
        unitPrice: Number(o.unitPrice || 0),
        fee: Number(o.fee),
        status: o.status,
        createdAt: o.createdAt,
      })),
      distributions: distPays.map((d) => ({
        id: d.id,
        type: d.distribution?.type || 'Unknown',
        amount: Number(d.amount),
        unitsAtRecord: d.unitsAtRecord,
        isPaid: d.isPaid,
        paidAt: d.paidAt,
        createdAt: d.createdAt,
      })),
      redemptions: redemptions.map((r) => ({
        id: r.id,
        productName: r.holding?.product?.name || 'Unknown',
        units: r.units,
        amount: Number(r.amount),
        status: r.status,
        reason: r.reason,
        rejectionReason: r.rejectionReason,
        createdAt: r.createdAt,
      })),
    };
  }

  // ── Pricing config ──

  async getPricingConfig(productId: string) {
    let config = await this.pricingRepo.findOne({ where: { productId } });
    if (!config) {
      config = this.pricingRepo.create({ productId });
      config = await this.pricingRepo.save(config);
    }
    return config;
  }

  async updatePricingConfig(productId: string, dto: Partial<{
    formulaType: PricingFormula;
    minUnitPrice: number;
    maxUnitPrice: number;
    navSchedule: NavSchedule;
    allowCorporateActions: boolean;
    distributionApprovalRequired: boolean;
    accrualMethod: AccrualMethod;
  }>) {
    const config = await this.getPricingConfig(productId);
    Object.assign(config, dto);
    return this.pricingRepo.save(config);
  }

  // ── NAV snapshots ──

  async recordNavSnapshot(productId: string, dto: { nav: number; unitPrice: number; snapshotDate: string }, createdBy: string) {
    const product = await this.getProduct(productId);
    const snapshot = new NavSnapshot();
    snapshot.productId = productId;
    snapshot.nav = dto.nav;
    snapshot.unitPrice = dto.unitPrice;
    snapshot.snapshotDate = new Date(dto.snapshotDate);
    snapshot.createdBy = createdBy;
    const saved = await this.navRepo.save(snapshot);
    product.unitPrice = dto.unitPrice;
    product.version += 1;
    await this.productRepo.save(product);
    await this._snapshotVersion(product, `NAV snapshot: ${dto.unitPrice}`, createdBy);
    return saved;
  }

  async getNavSnapshots(productId: string) {
    return this.navRepo.find({
      where: { productId },
      order: { snapshotDate: 'DESC' },
    });
  }

  async getLatestNavSnapshot(productId: string) {
    return this.navRepo.findOne({
      where: { productId },
      order: { snapshotDate: 'DESC' },
    });
  }

  // ── Corporate actions ──

  async createCorporateAction(productId: string, dto: {
    type: CorporateActionType;
    description?: string;
    ratioNumerator: number;
    ratioDenominator: number;
    effectiveDate: string;
  }, createdBy: string) {
    const product = await this.getProduct(productId);
    const action = new CorporateAction();
    action.productId = productId;
    action.type = dto.type;
    action.description = dto.description || null;
    action.ratioNumerator = dto.ratioNumerator;
    action.ratioDenominator = dto.ratioDenominator;
    action.effectiveDate = new Date(dto.effectiveDate);
    action.createdBy = createdBy;
    return this.corpActionRepo.save(action);
  }

  async approveCorporateAction(actionId: string, approvedBy: string) {
    const action = await this.corpActionRepo.findOne({ where: { id: actionId } });
    if (!action) throw new NotFoundException('Corporate action not found');
    if (action.status !== CorporateActionStatus.PENDING) throw new BadRequestException('Action already processed');
    action.status = CorporateActionStatus.APPROVED;
    action.approvedBy = approvedBy;
    action.approvedAt = new Date();
    return this.corpActionRepo.save(action);
  }

  async executeCorporateAction(actionId: string, executedBy: string) {
    const action = await this.corpActionRepo.findOne({ where: { id: actionId } });
    if (!action) throw new NotFoundException('Corporate action not found');
    if (action.status !== CorporateActionStatus.APPROVED) throw new BadRequestException('Action must be approved first');

    const product = await this.getProduct(action.productId);
    const holdings = await this.holdingRepo.find({ where: { productId: action.productId, isActive: true } });
    const ratio = action.ratioNumerator / action.ratioDenominator;

    for (const holding of holdings) {
      if (action.type === CorporateActionType.SPLIT) {
        holding.units = Math.floor(holding.units * ratio);
        holding.costBasis = Number(holding.costBasis) / ratio;
      } else if (action.type === CorporateActionType.BONUS) {
        holding.units = Math.floor(holding.units * ratio);
      } else if (action.type === CorporateActionType.DIVIDEND) {
        holding.currentValue = Number(holding.currentValue || 0) * ratio;
      } else if (action.type === CorporateActionType.BUYBACK) {
        holding.isActive = false;
      }
    }
    await this.holdingRepo.save(holdings);

    if (action.type === CorporateActionType.BUYBACK) {
      product.totalUnits = Math.floor(Number(product.totalUnits || 0) / ratio);
    }

    action.status = CorporateActionStatus.EXECUTED;
    action.executedBy = executedBy;
    action.executedAt = new Date();
    action.executionResult = {
      affectedHoldings: holdings.length,
      type: action.type,
      ratio: `${action.ratioNumerator}:${action.ratioDenominator}`,
    };
    await this.corpActionRepo.save(action);

    product.version += 1;
    await this.productRepo.save(product);
    await this._snapshotVersion(product, `Corporate action executed: ${action.type}`, executedBy);

    return { action, affectedHoldings: holdings.length };
  }

  async listCorporateActions(productId?: string) {
    const where: any = {};
    if (productId) where.productId = productId;
    return this.corpActionRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  // ── Distributions / payout runs ──

  async createDistribution(dto: {
    productId: string;
    type: DistributionType;
    amountPerUnit: number;
    totalPool: number;
    recordDate: string;
    payDate: string;
    description?: string;
  }, createdBy: string) {
    const product = await this.getProduct(dto.productId);
    const dist = new Distribution();
    dist.productId = dto.productId;
    dist.type = dto.type;
    dist.amountPerUnit = dto.amountPerUnit;
    dist.totalPool = dto.totalPool;
    dist.recordDate = new Date(dto.recordDate);
    dist.payDate = new Date(dto.payDate);
    dist.description = dto.description || null;
    dist.status = DistributionStatus.DRAFT;
    dist.createdBy = createdBy;
    return this.distRepo.save(dist);
  }

  async submitDistributionForApproval(distId: string) {
    const dist = await this.distRepo.findOne({ where: { id: distId } });
    if (!dist) throw new NotFoundException('Distribution not found');
    if (dist.status !== DistributionStatus.DRAFT) throw new BadRequestException('Only draft distributions can be submitted');
    dist.status = DistributionStatus.PENDING_APPROVAL;
    return this.distRepo.save(dist);
  }

  async approveDistribution(distId: string, approvedBy: string) {
    const dist = await this.distRepo.findOne({ where: { id: distId } });
    if (!dist) throw new NotFoundException('Distribution not found');
    if (dist.status !== DistributionStatus.PENDING_APPROVAL) throw new BadRequestException('Distribution not pending approval');
    dist.status = DistributionStatus.APPROVED;
    dist.approvedBy = approvedBy;
    dist.approvedAt = new Date();
    return this.distRepo.save(dist);
  }

  async computeDistributionRun(distId: string, createdBy: string) {
    const dist = await this.distRepo.findOne({ where: { id: distId } });
    if (!dist) throw new NotFoundException('Distribution not found');
    if (dist.status !== DistributionStatus.APPROVED) throw new BadRequestException('Distribution must be approved first');

    const holdings = await this.holdingRepo.find({
      where: { productId: dist.productId, isActive: true },
    });

    let totalAccrued = 0;
    const payouts: Array<{ userId: string; holdingId: string; amount: number; units: number }> = [];

    for (const holding of holdings) {
      const amount = holding.units * Number(dist.amountPerUnit);
      totalAccrued += amount;
      payouts.push({
        userId: holding.userId,
        holdingId: holding.id,
        amount: Math.round(amount * 100) / 100,
        units: holding.units,
      });
    }

    const run = new DistributionRun();
    run.distributionId = distId;
    run.productId = dist.productId;
    run.periodStart = new Date(dist.createdAt);
    run.periodEnd = new Date();
    run.totalAccrued = totalAccrued;
    run.totalHoldings = holdings.length;
    run.payoutCount = payouts.length;
    run.status = DistRunStatus.PAYOUTS_READY;
    run.createdBy = createdBy;
    run.runSummary = { computedPayouts: payouts.length, totalAccrued };
    const savedRun = await this.distRunRepo.save(run);

    const distPays = payouts.map((p) => {
      const dp = new DistributionPayment();
      dp.userId = p.userId;
      dp.holdingId = p.holdingId;
      dp.distributionId = distId;
      dp.amount = p.amount;
      dp.unitsAtRecord = p.units;
      dp.isPaid = false;
      return dp;
    });
    await this.distPayRepo.save(distPays);

    return savedRun;
  }

  async approveDistributionRun(runId: string, approvedBy: string) {
    const run = await this.distRunRepo.findOne({ where: { id: runId } });
    if (!run) throw new NotFoundException('Distribution run not found');
    if (run.status !== DistRunStatus.PAYOUTS_READY) throw new BadRequestException('Payouts not ready for approval');
    run.status = DistRunStatus.APPROVED;
    run.approvedBy = approvedBy;
    run.approvedAt = new Date();
    return this.distRunRepo.save(run);
  }

  async executeDistributionRun(runId: string, executedBy: string) {
    const run = await this.distRunRepo.findOne({ where: { id: runId } });
    if (!run) throw new NotFoundException('Distribution run not found');
    if (run.status !== DistRunStatus.APPROVED) throw new BadRequestException('Run must be approved first');

    const dist = await this.distRepo.findOne({ where: { id: run.distributionId } });
    if (!dist) throw new NotFoundException('Distribution not found');

    const payouts = await this.distPayRepo.find({ where: { distributionId: run.distributionId, isPaid: false } });

    let successCount = 0;
    let failedCount = 0;

    for (const payout of payouts) {
      try {
        payout.isPaid = true;
        payout.paidAt = new Date();
        await this.distPayRepo.save(payout);
        successCount++;
      } catch {
        failedCount++;
      }
    }

    run.successCount = successCount;
    run.failedCount = failedCount;
    run.status = failedCount > 0 && successCount === 0 ? DistRunStatus.FAILED : DistRunStatus.PAID;
    run.executedBy = executedBy;
    run.executedAt = new Date();
    await this.distRunRepo.save(run);

    dist.isPaid = true;
    dist.status = DistributionStatus.EXECUTED;
    await this.distRepo.save(dist);

    return { run, paid: successCount, failed: failedCount };
  }

  async listDistributionRuns(productId?: string) {
    const where: any = {};
    if (productId) where.productId = productId;
    return this.distRunRepo.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async listAllAdminDistributions(productId?: string) {
    const where: any = {};
    if (productId) where.productId = productId;
    return this.distRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  async getDistributionPayouts(distributionId: string) {
    return this.distPayRepo.find({
      where: { distributionId },
      order: { createdAt: 'DESC' },
    });
  }

  async markPayoutStatus(payoutId: string, isPaid: boolean) {
    const payout = await this.distPayRepo.findOne({ where: { id: payoutId } });
    if (!payout) throw new NotFoundException('Payout not found');
    payout.isPaid = isPaid;
    payout.paidAt = isPaid ? new Date() : null;
    return this.distPayRepo.save(payout);
  }

  async getAdminDistributions(productId?: string) {
    const where: any = {};
    if (productId) where.productId = productId;
    return this.distRepo.find({ where, order: { createdAt: 'DESC' } });
  }
}
