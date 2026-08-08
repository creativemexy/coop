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
exports.InvestmentsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const investment_product_entity_1 = require("./entities/investment-product.entity");
const investment_product_version_entity_1 = require("./entities/investment-product-version.entity");
const investment_eligibility_rule_entity_1 = require("./entities/investment-eligibility-rule.entity");
const share_issuance_cycle_entity_1 = require("./entities/share-issuance-cycle.entity");
const investment_order_entity_1 = require("./entities/investment-order.entity");
const investment_holding_entity_1 = require("./entities/investment-holding.entity");
const distribution_entity_1 = require("./entities/distribution.entity");
const distribution_payment_entity_1 = require("./entities/distribution-payment.entity");
const distribution_run_entity_1 = require("./entities/distribution-run.entity");
const redemption_request_entity_1 = require("./entities/redemption-request.entity");
const pricing_config_entity_1 = require("./entities/pricing-config.entity");
const nav_snapshot_entity_1 = require("./entities/nav-snapshot.entity");
const corporate_action_entity_1 = require("./entities/corporate-action.entity");
const payment_entity_1 = require("../payments/entities/payment.entity");
const status_enum_1 = require("../../common/enums/status.enum");
const users_service_1 = require("../users/users.service");
let InvestmentsService = class InvestmentsService {
    usersService;
    productRepo;
    versionRepo;
    orderRepo;
    holdingRepo;
    distRepo;
    distPayRepo;
    eligibilityRepo;
    cycleRepo;
    redemptionRepo;
    paymentRepo;
    pricingRepo;
    navRepo;
    corpActionRepo;
    distRunRepo;
    constructor(usersService, productRepo, versionRepo, orderRepo, holdingRepo, distRepo, distPayRepo, eligibilityRepo, cycleRepo, redemptionRepo, paymentRepo, pricingRepo, navRepo, corpActionRepo, distRunRepo) {
        this.usersService = usersService;
        this.productRepo = productRepo;
        this.versionRepo = versionRepo;
        this.orderRepo = orderRepo;
        this.holdingRepo = holdingRepo;
        this.distRepo = distRepo;
        this.distPayRepo = distPayRepo;
        this.eligibilityRepo = eligibilityRepo;
        this.cycleRepo = cycleRepo;
        this.redemptionRepo = redemptionRepo;
        this.paymentRepo = paymentRepo;
        this.pricingRepo = pricingRepo;
        this.navRepo = navRepo;
        this.corpActionRepo = corpActionRepo;
        this.distRunRepo = distRunRepo;
    }
    async listProducts(filters) {
        const where = { status: investment_product_entity_1.ProductStatus.ACTIVE };
        if (filters?.type)
            where.type = filters.type;
        if (filters?.riskTier)
            where.riskTier = filters.riskTier;
        if (filters?.isOpen !== undefined)
            where.isOpen = filters.isOpen;
        return this.productRepo.find({ where, order: { createdAt: 'DESC' } });
    }
    async getProduct(id) {
        const product = await this.productRepo.findOne({ where: { id } });
        if (!product)
            throw new common_1.NotFoundException('Investment product not found');
        return product;
    }
    async placeOrder(userId, dto) {
        const product = await this.getProduct(dto.productId);
        if (!product.isOpen)
            throw new common_1.BadRequestException('Investment product is not open');
        if (dto.amount < Number(product.minimumInvestment)) {
            throw new common_1.BadRequestException(`Minimum investment is ${product.minimumInvestment}`);
        }
        if (product.maximumInvestment && dto.amount > Number(product.maximumInvestment)) {
            throw new common_1.BadRequestException(`Maximum investment is ${product.maximumInvestment}`);
        }
        const eligibility = await this.checkFullEligibility(userId, dto.productId);
        if (!eligibility.allowed) {
            const reasons = eligibility.reasons.filter((r) => !r.passed).map((r) => r.label).join(', ');
            throw new common_1.BadRequestException(`Not eligible: ${reasons}`);
        }
        const pricingConfig = await this.pricingRepo.findOne({ where: { productId: dto.productId } });
        let unitPrice = Number(product.unitPrice) || 1;
        if (pricingConfig?.formulaType === pricing_config_entity_1.PricingFormula.NAV_BASED) {
            const latestNav = await this.getLatestNavSnapshot(dto.productId);
            if (latestNav)
                unitPrice = Number(latestNav.unitPrice);
        }
        if (pricingConfig?.minUnitPrice)
            unitPrice = Math.max(unitPrice, Number(pricingConfig.minUnitPrice));
        if (pricingConfig?.maxUnitPrice)
            unitPrice = Math.min(unitPrice, Number(pricingConfig.maxUnitPrice));
        const fee = Math.round(dto.amount * Number(product.managementFeeRate) / 100 * 100) / 100;
        const units = Math.floor((dto.amount - fee) / unitPrice);
        const order = new investment_order_entity_1.InvestmentOrder();
        order.userId = userId;
        order.productId = dto.productId;
        order.amount = dto.amount;
        order.units = units;
        order.unitPrice = unitPrice;
        order.fee = fee;
        order.productVersion = product.version;
        order.status = investment_order_entity_1.OrderStatus.PLACED;
        return this.orderRepo.save(order);
    }
    async confirmPayment(orderId, paymentReference, paymentId) {
        const order = await this.orderRepo.findOne({ where: { id: orderId }, relations: { product: true } });
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        if (order.status !== investment_order_entity_1.OrderStatus.PLACED)
            throw new common_1.BadRequestException('Order already processed');
        order.status = investment_order_entity_1.OrderStatus.PAYMENT_CONFIRMED;
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
        const holding = new investment_holding_entity_1.InvestmentHolding();
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
        order.status = investment_order_entity_1.OrderStatus.ALLOCATED;
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
    async getMyOrders(userId) {
        return this.orderRepo.find({
            where: { userId },
            relations: { product: true },
            order: { createdAt: 'DESC' },
        });
    }
    async getMyHoldings(userId) {
        return this.holdingRepo.find({
            where: { userId, isActive: true },
            relations: { product: true },
            order: { createdAt: 'DESC' },
        });
    }
    async getPortfolioSummary(userId) {
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
    async getDistributions(productId) {
        const where = {};
        if (productId)
            where.productId = productId;
        return this.distRepo.find({ where, order: { createdAt: 'DESC' } });
    }
    async getMyDistributionHistory(userId) {
        return this.distPayRepo.find({
            where: { userId },
            relations: { distribution: true },
            order: { createdAt: 'DESC' },
        });
    }
    async getPendingDistributions(userId) {
        return this.distPayRepo.find({
            where: { userId, isPaid: false },
            relations: { distribution: true },
            order: { createdAt: 'DESC' },
        });
    }
    async requestRedemption(userId, dto) {
        const holding = await this.holdingRepo.findOne({ where: { id: dto.holdingId, userId, isActive: true }, relations: { product: true } });
        if (!holding)
            throw new common_1.NotFoundException('Holding not found');
        if (holding.isLocked && holding.lockedUntil && new Date(holding.lockedUntil) > new Date()) {
            throw new common_1.BadRequestException(`Holding is locked until ${holding.lockedUntil.toISOString().slice(0, 10)}`);
        }
        if (dto.units > holding.units) {
            throw new common_1.BadRequestException('Requested units exceed holding');
        }
        const amount = dto.units * (Number(holding.currentValue) / holding.units);
        const request = new redemption_request_entity_1.RedemptionRequest();
        request.userId = userId;
        request.holdingId = dto.holdingId;
        request.units = dto.units;
        request.amount = Math.round(amount * 100) / 100;
        request.reason = dto.reason ?? null;
        request.status = redemption_request_entity_1.RedemptionStatus.REQUESTED;
        return this.redemptionRepo.save(request);
    }
    async createProduct(dto) {
        const product = new investment_product_entity_1.InvestmentProduct();
        product.name = dto.name;
        product.description = dto.description || null;
        product.type = dto.type;
        product.riskTier = dto.riskTier || investment_product_entity_1.RiskTier.MEDIUM;
        product.minimumInvestment = dto.minimumInvestment;
        product.maximumInvestment = dto.maximumInvestment ?? null;
        product.unitPrice = dto.unitPrice ?? null;
        product.lockInDays = dto.lockInDays ?? 0;
        product.tenorDays = dto.tenorDays ?? null;
        product.managementFeeRate = dto.managementFeeRate ?? 0;
        product.expectedReturnRate = dto.expectedReturnRate ?? 0;
        product.profitSharingRules = dto.profitSharingRules || null;
        product.distributionFrequency = dto.distributionFrequency || investment_product_entity_1.DistributionFrequency.MATURITY;
        product.totalUnits = dto.totalUnits ?? null;
        product.availableUnits = dto.availableUnits ?? null;
        product.currentCapacity = 0;
        product.isOpen = true;
        product.status = investment_product_entity_1.ProductStatus.DRAFT;
        product.version = 1;
        product.createdBy = dto.createdBy;
        const saved = await this.productRepo.save(product);
        await this._snapshotVersion(saved, 'Initial creation', dto.createdBy);
        return saved;
    }
    async updateProduct(id, dto, changedBy) {
        const product = await this.getProduct(id);
        Object.assign(product, dto);
        product.version += 1;
        const saved = await this.productRepo.save(product);
        await this._snapshotVersion(saved, dto.changeSummary || `Updated to v${saved.version}`, changedBy);
        return saved;
    }
    async setProductStatus(id, status, changedBy) {
        const product = await this.getProduct(id);
        const allowed = investment_product_entity_1.VALID_LIFECYCLE_TRANSITIONS[product.status] || [];
        if (!allowed.includes(status)) {
            throw new common_1.BadRequestException(`Cannot transition from ${product.status} to ${status}. Allowed: ${allowed.join(', ') || 'none'}`);
        }
        const oldStatus = product.status;
        product.status = status;
        product.version += 1;
        if (status === investment_product_entity_1.ProductStatus.CLOSED || status === investment_product_entity_1.ProductStatus.ARCHIVED)
            product.isOpen = false;
        if (status === investment_product_entity_1.ProductStatus.ACTIVE || status === investment_product_entity_1.ProductStatus.PENDING_REVIEW)
            product.isOpen = true;
        const saved = await this.productRepo.save(product);
        await this._snapshotVersion(saved, `Status changed: ${oldStatus} → ${status}`, changedBy);
        return saved;
    }
    async getProductVersions(id) {
        return this.versionRepo.find({
            where: { productId: id },
            order: { version: 'DESC' },
        });
    }
    async listAllProducts(filters) {
        const where = {};
        if (filters?.type)
            where.type = filters.type;
        if (filters?.riskTier)
            where.riskTier = filters.riskTier;
        if (filters?.status)
            where.status = filters.status;
        return this.productRepo.find({ where, order: { createdAt: 'DESC' } });
    }
    async _snapshotVersion(product, changeSummary, changedBy) {
        const version = new investment_product_version_entity_1.InvestmentProductVersion();
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
    async getEligibilityRules(productId) {
        let rules = await this.eligibilityRepo.findOne({ where: { productId } });
        if (!rules) {
            const product = await this.getProduct(productId);
            rules = this.eligibilityRepo.create({ productId, kycRequiredLevel: investment_eligibility_rule_entity_1.KycLevel.BASIC });
            rules = await this.eligibilityRepo.save(rules);
        }
        return rules;
    }
    async updateEligibilityRules(productId, dto) {
        const rules = await this.getEligibilityRules(productId);
        Object.assign(rules, dto);
        return this.eligibilityRepo.save(rules);
    }
    async setCapacity(id, dto) {
        const product = await this.getProduct(id);
        if (dto.totalCapacity !== undefined)
            product.totalCapacity = dto.totalCapacity;
        if (dto.perInvestorCaps !== undefined)
            product.perInvestorCaps = dto.perInvestorCaps;
        return this.productRepo.save(product);
    }
    async createIssuanceCycle(productId, dto) {
        const product = await this.getProduct(productId);
        const cycle = new share_issuance_cycle_entity_1.ShareIssuanceCycle();
        cycle.productId = productId;
        cycle.cycleName = dto.cycleName;
        cycle.totalUnits = dto.totalUnits;
        cycle.unitPrice = dto.unitPrice;
        cycle.totalValue = dto.totalValue;
        cycle.openDate = dto.openDate ? new Date(dto.openDate) : null;
        cycle.closeDate = dto.closeDate ? new Date(dto.closeDate) : null;
        cycle.createdBy = dto.createdBy;
        cycle.status = share_issuance_cycle_entity_1.CycleStatus.PENDING;
        return this.cycleRepo.save(cycle);
    }
    async approveIssuanceCycle(cycleId, approvedBy) {
        const cycle = await this.cycleRepo.findOne({ where: { id: cycleId } });
        if (!cycle)
            throw new common_1.NotFoundException('Issuance cycle not found');
        if (cycle.status !== share_issuance_cycle_entity_1.CycleStatus.PENDING)
            throw new common_1.BadRequestException('Cycle already processed');
        cycle.status = share_issuance_cycle_entity_1.CycleStatus.APPROVED;
        cycle.approvedBy = approvedBy;
        cycle.approvedAt = new Date();
        return this.cycleRepo.save(cycle);
    }
    async getIssuanceCycles(productId) {
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
    async isInvestorAllowed(productId, userId) {
        const rules = await this.eligibilityRepo.findOne({ where: { productId } });
        if (!rules)
            return { allowed: true };
        if (rules.investorBlacklist?.includes(userId)) {
            return { allowed: false, reason: 'Investor is blacklisted' };
        }
        if (rules.investorWhitelist?.length && !rules.investorWhitelist.includes(userId)) {
            return { allowed: false, reason: 'Investor is not whitelisted' };
        }
        return { allowed: true };
    }
    async checkFullEligibility(userId, productId) {
        const product = await this.getProduct(productId);
        const user = await this.usersService.findById(userId);
        const rules = await this.getEligibilityRules(productId);
        const reasons = [];
        const whitelistCheck = await this.isInvestorAllowed(productId, userId);
        reasons.push({
            key: 'access_list',
            label: 'Investor access',
            passed: whitelistCheck.allowed,
            detail: whitelistCheck.reason,
        });
        let kycOk = true;
        if (rules.kycRequiredLevel !== investment_eligibility_rule_entity_1.KycLevel.NONE) {
            const userKyc = user.kycStatus;
            kycOk = rules.kycRequiredLevel === investment_eligibility_rule_entity_1.KycLevel.ADVANCED
                ? userKyc === status_enum_1.KycStatus.APPROVED
                : userKyc === status_enum_1.KycStatus.APPROVED;
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
    async getCompliance(userId, productId) {
        const user = await this.usersService.findById(userId);
        const kycApproved = user.kycStatus === status_enum_1.KycStatus.APPROVED;
        const requirements = [
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
    async getMyRedemptions(userId) {
        return this.redemptionRepo.find({
            where: { userId },
            relations: { holding: { product: true } },
            order: { createdAt: 'DESC' },
        });
    }
    async getInvestmentStatement(userId) {
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
    async getPricingConfig(productId) {
        let config = await this.pricingRepo.findOne({ where: { productId } });
        if (!config) {
            config = this.pricingRepo.create({ productId });
            config = await this.pricingRepo.save(config);
        }
        return config;
    }
    async updatePricingConfig(productId, dto) {
        const config = await this.getPricingConfig(productId);
        Object.assign(config, dto);
        return this.pricingRepo.save(config);
    }
    async recordNavSnapshot(productId, dto, createdBy) {
        const product = await this.getProduct(productId);
        const snapshot = new nav_snapshot_entity_1.NavSnapshot();
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
    async getNavSnapshots(productId) {
        return this.navRepo.find({
            where: { productId },
            order: { snapshotDate: 'DESC' },
        });
    }
    async getLatestNavSnapshot(productId) {
        return this.navRepo.findOne({
            where: { productId },
            order: { snapshotDate: 'DESC' },
        });
    }
    async createCorporateAction(productId, dto, createdBy) {
        const product = await this.getProduct(productId);
        const action = new corporate_action_entity_1.CorporateAction();
        action.productId = productId;
        action.type = dto.type;
        action.description = dto.description || null;
        action.ratioNumerator = dto.ratioNumerator;
        action.ratioDenominator = dto.ratioDenominator;
        action.effectiveDate = new Date(dto.effectiveDate);
        action.createdBy = createdBy;
        return this.corpActionRepo.save(action);
    }
    async approveCorporateAction(actionId, approvedBy) {
        const action = await this.corpActionRepo.findOne({ where: { id: actionId } });
        if (!action)
            throw new common_1.NotFoundException('Corporate action not found');
        if (action.status !== corporate_action_entity_1.CorporateActionStatus.PENDING)
            throw new common_1.BadRequestException('Action already processed');
        action.status = corporate_action_entity_1.CorporateActionStatus.APPROVED;
        action.approvedBy = approvedBy;
        action.approvedAt = new Date();
        return this.corpActionRepo.save(action);
    }
    async executeCorporateAction(actionId, executedBy) {
        const action = await this.corpActionRepo.findOne({ where: { id: actionId } });
        if (!action)
            throw new common_1.NotFoundException('Corporate action not found');
        if (action.status !== corporate_action_entity_1.CorporateActionStatus.APPROVED)
            throw new common_1.BadRequestException('Action must be approved first');
        const product = await this.getProduct(action.productId);
        const holdings = await this.holdingRepo.find({ where: { productId: action.productId, isActive: true } });
        const ratio = action.ratioNumerator / action.ratioDenominator;
        for (const holding of holdings) {
            if (action.type === corporate_action_entity_1.CorporateActionType.SPLIT) {
                holding.units = Math.floor(holding.units * ratio);
                holding.costBasis = Number(holding.costBasis) / ratio;
            }
            else if (action.type === corporate_action_entity_1.CorporateActionType.BONUS) {
                holding.units = Math.floor(holding.units * ratio);
            }
            else if (action.type === corporate_action_entity_1.CorporateActionType.DIVIDEND) {
                holding.currentValue = Number(holding.currentValue || 0) * ratio;
            }
            else if (action.type === corporate_action_entity_1.CorporateActionType.BUYBACK) {
                holding.isActive = false;
            }
        }
        await this.holdingRepo.save(holdings);
        if (action.type === corporate_action_entity_1.CorporateActionType.BUYBACK) {
            product.totalUnits = Math.floor(Number(product.totalUnits || 0) / ratio);
        }
        action.status = corporate_action_entity_1.CorporateActionStatus.EXECUTED;
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
    async listCorporateActions(productId) {
        const where = {};
        if (productId)
            where.productId = productId;
        return this.corpActionRepo.find({ where, order: { createdAt: 'DESC' } });
    }
    async createDistribution(dto, createdBy) {
        const product = await this.getProduct(dto.productId);
        const dist = new distribution_entity_1.Distribution();
        dist.productId = dto.productId;
        dist.type = dto.type;
        dist.amountPerUnit = dto.amountPerUnit;
        dist.totalPool = dto.totalPool;
        dist.recordDate = new Date(dto.recordDate);
        dist.payDate = new Date(dto.payDate);
        dist.description = dto.description || null;
        dist.status = distribution_entity_1.DistributionStatus.DRAFT;
        dist.createdBy = createdBy;
        return this.distRepo.save(dist);
    }
    async submitDistributionForApproval(distId) {
        const dist = await this.distRepo.findOne({ where: { id: distId } });
        if (!dist)
            throw new common_1.NotFoundException('Distribution not found');
        if (dist.status !== distribution_entity_1.DistributionStatus.DRAFT)
            throw new common_1.BadRequestException('Only draft distributions can be submitted');
        dist.status = distribution_entity_1.DistributionStatus.PENDING_APPROVAL;
        return this.distRepo.save(dist);
    }
    async approveDistribution(distId, approvedBy) {
        const dist = await this.distRepo.findOne({ where: { id: distId } });
        if (!dist)
            throw new common_1.NotFoundException('Distribution not found');
        if (dist.status !== distribution_entity_1.DistributionStatus.PENDING_APPROVAL)
            throw new common_1.BadRequestException('Distribution not pending approval');
        dist.status = distribution_entity_1.DistributionStatus.APPROVED;
        dist.approvedBy = approvedBy;
        dist.approvedAt = new Date();
        return this.distRepo.save(dist);
    }
    async computeDistributionRun(distId, createdBy) {
        const dist = await this.distRepo.findOne({ where: { id: distId } });
        if (!dist)
            throw new common_1.NotFoundException('Distribution not found');
        if (dist.status !== distribution_entity_1.DistributionStatus.APPROVED)
            throw new common_1.BadRequestException('Distribution must be approved first');
        const holdings = await this.holdingRepo.find({
            where: { productId: dist.productId, isActive: true },
        });
        let totalAccrued = 0;
        const payouts = [];
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
        const run = new distribution_run_entity_1.DistributionRun();
        run.distributionId = distId;
        run.productId = dist.productId;
        run.periodStart = new Date(dist.createdAt);
        run.periodEnd = new Date();
        run.totalAccrued = totalAccrued;
        run.totalHoldings = holdings.length;
        run.payoutCount = payouts.length;
        run.status = distribution_run_entity_1.DistRunStatus.PAYOUTS_READY;
        run.createdBy = createdBy;
        run.runSummary = { computedPayouts: payouts.length, totalAccrued };
        const savedRun = await this.distRunRepo.save(run);
        const distPays = payouts.map((p) => {
            const dp = new distribution_payment_entity_1.DistributionPayment();
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
    async approveDistributionRun(runId, approvedBy) {
        const run = await this.distRunRepo.findOne({ where: { id: runId } });
        if (!run)
            throw new common_1.NotFoundException('Distribution run not found');
        if (run.status !== distribution_run_entity_1.DistRunStatus.PAYOUTS_READY)
            throw new common_1.BadRequestException('Payouts not ready for approval');
        run.status = distribution_run_entity_1.DistRunStatus.APPROVED;
        run.approvedBy = approvedBy;
        run.approvedAt = new Date();
        return this.distRunRepo.save(run);
    }
    async executeDistributionRun(runId, executedBy) {
        const run = await this.distRunRepo.findOne({ where: { id: runId } });
        if (!run)
            throw new common_1.NotFoundException('Distribution run not found');
        if (run.status !== distribution_run_entity_1.DistRunStatus.APPROVED)
            throw new common_1.BadRequestException('Run must be approved first');
        const dist = await this.distRepo.findOne({ where: { id: run.distributionId } });
        if (!dist)
            throw new common_1.NotFoundException('Distribution not found');
        const payouts = await this.distPayRepo.find({ where: { distributionId: run.distributionId, isPaid: false } });
        let successCount = 0;
        let failedCount = 0;
        for (const payout of payouts) {
            try {
                payout.isPaid = true;
                payout.paidAt = new Date();
                await this.distPayRepo.save(payout);
                successCount++;
            }
            catch {
                failedCount++;
            }
        }
        run.successCount = successCount;
        run.failedCount = failedCount;
        run.status = failedCount > 0 && successCount === 0 ? distribution_run_entity_1.DistRunStatus.FAILED : distribution_run_entity_1.DistRunStatus.PAID;
        run.executedBy = executedBy;
        run.executedAt = new Date();
        await this.distRunRepo.save(run);
        dist.isPaid = true;
        dist.status = distribution_entity_1.DistributionStatus.EXECUTED;
        await this.distRepo.save(dist);
        return { run, paid: successCount, failed: failedCount };
    }
    async listDistributionRuns(productId) {
        const where = {};
        if (productId)
            where.productId = productId;
        return this.distRunRepo.find({
            where,
            order: { createdAt: 'DESC' },
        });
    }
    async listAllAdminDistributions(productId) {
        const where = {};
        if (productId)
            where.productId = productId;
        return this.distRepo.find({ where, order: { createdAt: 'DESC' } });
    }
    async getDistributionPayouts(distributionId) {
        return this.distPayRepo.find({
            where: { distributionId },
            order: { createdAt: 'DESC' },
        });
    }
    async markPayoutStatus(payoutId, isPaid) {
        const payout = await this.distPayRepo.findOne({ where: { id: payoutId } });
        if (!payout)
            throw new common_1.NotFoundException('Payout not found');
        payout.isPaid = isPaid;
        payout.paidAt = isPaid ? new Date() : null;
        return this.distPayRepo.save(payout);
    }
    async getAdminDistributions(productId) {
        const where = {};
        if (productId)
            where.productId = productId;
        return this.distRepo.find({ where, order: { createdAt: 'DESC' } });
    }
};
exports.InvestmentsService = InvestmentsService;
exports.InvestmentsService = InvestmentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_1.InjectRepository)(investment_product_entity_1.InvestmentProduct)),
    __param(2, (0, typeorm_1.InjectRepository)(investment_product_version_entity_1.InvestmentProductVersion)),
    __param(3, (0, typeorm_1.InjectRepository)(investment_order_entity_1.InvestmentOrder)),
    __param(4, (0, typeorm_1.InjectRepository)(investment_holding_entity_1.InvestmentHolding)),
    __param(5, (0, typeorm_1.InjectRepository)(distribution_entity_1.Distribution)),
    __param(6, (0, typeorm_1.InjectRepository)(distribution_payment_entity_1.DistributionPayment)),
    __param(7, (0, typeorm_1.InjectRepository)(investment_eligibility_rule_entity_1.InvestmentEligibilityRule)),
    __param(8, (0, typeorm_1.InjectRepository)(share_issuance_cycle_entity_1.ShareIssuanceCycle)),
    __param(9, (0, typeorm_1.InjectRepository)(redemption_request_entity_1.RedemptionRequest)),
    __param(10, (0, typeorm_1.InjectRepository)(payment_entity_1.Payment)),
    __param(11, (0, typeorm_1.InjectRepository)(pricing_config_entity_1.PricingConfig)),
    __param(12, (0, typeorm_1.InjectRepository)(nav_snapshot_entity_1.NavSnapshot)),
    __param(13, (0, typeorm_1.InjectRepository)(corporate_action_entity_1.CorporateAction)),
    __param(14, (0, typeorm_1.InjectRepository)(distribution_run_entity_1.DistributionRun)),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], InvestmentsService);
//# sourceMappingURL=investments.service.js.map