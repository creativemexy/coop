import { DataSource } from 'typeorm';
import {
  InvestmentProduct,
  InvestmentType,
  RiskTier,
  DistributionFrequency,
  ProductStatus,
} from '../../modules/investments/entities/investment-product.entity';
import { InvestmentProductVersion } from '../../modules/investments/entities/investment-product-version.entity';
import {
  InvestmentEligibilityRule,
  KycLevel,
} from '../../modules/investments/entities/investment-eligibility-rule.entity';
import {
  PricingConfig,
  PricingFormula,
  NavSchedule,
  AccrualMethod,
} from '../../modules/investments/entities/pricing-config.entity';
import {
  ShareIssuanceCycle,
  CycleStatus,
} from '../../modules/investments/entities/share-issuance-cycle.entity';
import { NavSnapshot } from '../../modules/investments/entities/nav-snapshot.entity';
import {
  CorporateAction,
  CorporateActionType,
  CorporateActionStatus,
} from '../../modules/investments/entities/corporate-action.entity';
import {
  Distribution,
  DistributionType,
  DistributionStatus,
} from '../../modules/investments/entities/distribution.entity';

const SYS_ADMIN = '00000000-0000-0000-0000-000000000001';

interface ProductSeed {
  name: string;
  description: string;
  type: InvestmentType;
  riskTier: RiskTier;
  minimumInvestment: number;
  maximumInvestment: number | null;
  unitPrice: number | null;
  lockInDays: number;
  tenorDays: number | null;
  managementFeeRate: number;
  expectedReturnRate: number;
  profitSharingRules: string | null;
  distributionFrequency: DistributionFrequency;
  totalUnits: number | null;
  availableUnits: number | null;
  totalCapacity: number | null;
  perInvestorCaps: { min?: number; max?: number } | null;
  eligibility: {
    kycRequiredLevel: KycLevel;
    requireMembership: boolean;
    allowedGeographies: string[] | null;
    accreditationRequired: boolean;
  };
  pricing: {
    formulaType: PricingFormula;
    minUnitPrice: number | null;
    maxUnitPrice: number | null;
    navSchedule: NavSchedule | null;
    allowCorporateActions: boolean;
    distributionApprovalRequired: boolean;
    accrualMethod: AccrualMethod;
  };
}

const PRODUCTS: ProductSeed[] = [
  {
    name: 'Coop Growth Shares',
    description: 'Long-term growth shares in the cooperative investment pool targeting capital appreciation with quarterly profit distributions. Members invest at a fixed unit price of ₦1,000 per unit and earn an expected annual return of 8% before a 1.5% management fee. Profits are shared 80/20 (80% to investors, 20% to the cooperative) after fees. A 90-day lock-in applies from purchase; shares redeemed before the lock-in ends incur an early-withdrawal penalty of 5% of principal plus forfeiture of any accrued but unpaid distributions. After lock-in, redemptions are processed at the current NAV.',
    type: InvestmentType.SHARES,
    riskTier: RiskTier.MEDIUM,
    minimumInvestment: 50000,
    maximumInvestment: 10000000,
    unitPrice: 1000,
    lockInDays: 90,
    tenorDays: null,
    managementFeeRate: 1.5,
    expectedReturnRate: 8,
    profitSharingRules: '80/20 profit share after management fees',
    distributionFrequency: DistributionFrequency.QUARTERLY,
    totalUnits: 100000,
    availableUnits: 75000,
    totalCapacity: 100000000,
    perInvestorCaps: { min: 50000, max: 10000000 },
    eligibility: {
      kycRequiredLevel: KycLevel.BASIC,
      requireMembership: true,
      allowedGeographies: ['NG'],
      accreditationRequired: false,
    },
    pricing: {
      formulaType: PricingFormula.NAV_BASED,
      minUnitPrice: 950,
      maxUnitPrice: 1200,
      navSchedule: NavSchedule.WEEKLY,
      allowCorporateActions: true,
      distributionApprovalRequired: true,
      accrualMethod: AccrualMethod.COMPOUND,
    },
  },
  {
    name: 'Fixed Income Deposit',
    description: 'Capital-protected fixed income deposit paying monthly interest at a guaranteed annual rate of 5% (0.75% annual management fee). Principal is guaranteed at maturity (365 days). Early withdrawal before maturity is penalised: within the first 30 days, no interest is paid and a 1% penalty on principal applies; after 30 days, interest is recalculated at 50% of the stated rate and a 2% penalty on principal applies. Minimum deposit ₦100,000; maximum ₦50,000,000 per investor.',
    type: InvestmentType.FIXED_INCOME,
    riskTier: RiskTier.LOW,
    minimumInvestment: 100000,
    maximumInvestment: 50000000,
    unitPrice: null,
    lockInDays: 30,
    tenorDays: 365,
    managementFeeRate: 0.75,
    expectedReturnRate: 5,
    profitSharingRules: null,
    distributionFrequency: DistributionFrequency.MONTHLY,
    totalUnits: null,
    availableUnits: null,
    totalCapacity: 500000000,
    perInvestorCaps: { min: 100000, max: 50000000 },
    eligibility: {
      kycRequiredLevel: KycLevel.BASIC,
      requireMembership: true,
      allowedGeographies: ['NG'],
      accreditationRequired: false,
    },
    pricing: {
      formulaType: PricingFormula.SIMPLE,
      minUnitPrice: null,
      maxUnitPrice: null,
      navSchedule: null,
      allowCorporateActions: false,
      distributionApprovalRequired: true,
      accrualMethod: AccrualMethod.SIMPLE,
    },
  },
  {
    name: 'Pooled Micro-Investment',
    description: 'High-yield pooled fund investing across cooperative ventures such as asset financing, trade and working capital. Expected annual return of 12% with a 2% management fee and 70/30 profit share (70% to investors, 30% to the cooperative). Requires advanced KYC and accredited-investor status. Units are priced at ₦500 with daily NAV updates. A 180-day lock-in and tenor applies; redeeming before maturity incurs a 10% penalty on principal plus forfeiture of any accrued profit share.',
    type: InvestmentType.POOLED,
    riskTier: RiskTier.HIGH,
    minimumInvestment: 10000,
    maximumInvestment: 5000000,
    unitPrice: 500,
    lockInDays: 180,
    tenorDays: 180,
    managementFeeRate: 2,
    expectedReturnRate: 12,
    profitSharingRules: '70/30 profit share after management fees',
    distributionFrequency: DistributionFrequency.ANNUALLY,
    totalUnits: 200000,
    availableUnits: 150000,
    totalCapacity: 100000000,
    perInvestorCaps: { min: 10000, max: 5000000 },
    eligibility: {
      kycRequiredLevel: KycLevel.ADVANCED,
      requireMembership: false,
      allowedGeographies: ['NG'],
      accreditationRequired: true,
    },
    pricing: {
      formulaType: PricingFormula.NAV_BASED,
      minUnitPrice: 450,
      maxUnitPrice: 700,
      navSchedule: NavSchedule.DAILY,
      allowCorporateActions: true,
      distributionApprovalRequired: true,
      accrualMethod: AccrualMethod.COMPOUND,
    },
  },
  {
    name: 'Youth Investment Plan',
    description: 'Low-barrier entry product designed for young cooperators to build a savings-and-investment habit early. Minimum investment of just ₦5,000 with a 4% expected annual return, 0.5% management fee and monthly distributions on a 90/10 profit-share basis (90% to investors, 10% to the cooperative). No KYC level required. A short 30-day lock-in applies; early withdrawal within the lock-in period incurs a 3% penalty on principal.',
    type: InvestmentType.SHARES,
    riskTier: RiskTier.LOW,
    minimumInvestment: 5000,
    maximumInvestment: 500000,
    unitPrice: 250,
    lockInDays: 30,
    tenorDays: null,
    managementFeeRate: 0.5,
    expectedReturnRate: 4,
    profitSharingRules: '90/10 profit share after management fees',
    distributionFrequency: DistributionFrequency.MONTHLY,
    totalUnits: 500000,
    availableUnits: 420000,
    totalCapacity: 125000000,
    perInvestorCaps: { min: 5000, max: 500000 },
    eligibility: {
      kycRequiredLevel: KycLevel.NONE,
      requireMembership: true,
      allowedGeographies: ['NG'],
      accreditationRequired: false,
    },
    pricing: {
      formulaType: PricingFormula.SIMPLE,
      minUnitPrice: null,
      maxUnitPrice: null,
      navSchedule: null,
      allowCorporateActions: false,
      distributionApprovalRequired: false,
      accrualMethod: AccrualMethod.SIMPLE,
    },
  },
];

const ISSUANCE_CYCLES: Array<Omit<ShareIssuanceCycle, 'id' | 'product' | 'productId' | 'createdAt' | 'updatedAt'>> = [
  {
    cycleName: 'Q1 2026 Issuance',
    totalUnits: 25000,
    allocatedUnits: 25000,
    unitPrice: 1000,
    totalValue: 25000000,
    openDate: new Date('2026-01-02'),
    closeDate: new Date('2026-01-31'),
    status: CycleStatus.CLOSED,
    approvedBy: SYS_ADMIN,
    approvedAt: new Date('2026-01-01T09:00:00Z'),
    createdBy: SYS_ADMIN,
  },
  {
    cycleName: 'Q2 2026 Issuance',
    totalUnits: 25000,
    allocatedUnits: 0,
    unitPrice: 1000,
    totalValue: 25000000,
    openDate: new Date('2026-04-01'),
    closeDate: new Date('2026-04-30'),
    status: CycleStatus.ACTIVE,
    approvedBy: SYS_ADMIN,
    approvedAt: new Date('2026-03-28T09:00:00Z'),
    createdBy: SYS_ADMIN,
  },
];

const NAV_SNAPSHOTS: Array<Omit<NavSnapshot, 'id' | 'productId' | 'createdAt'>> = [
  { nav: 1040.5, unitPrice: 1040.5, snapshotDate: new Date('2026-06-30'), createdBy: SYS_ADMIN },
  { nav: 1020.75, unitPrice: 1020.75, snapshotDate: new Date('2026-06-23'), createdBy: SYS_ADMIN },
  { nav: 1000.0, unitPrice: 1000.0, snapshotDate: new Date('2026-06-16'), createdBy: SYS_ADMIN },
];

const CORPORATE_ACTIONS: Array<Omit<CorporateAction, 'id' | 'productId' | 'createdAt' | 'updatedAt' | 'product'>> = [
  {
    type: CorporateActionType.BONUS,
    description: '1-for-10 bonus share issue to reward existing members',
    ratioNumerator: 1,
    ratioDenominator: 10,
    effectiveDate: new Date('2026-03-15'),
    status: CorporateActionStatus.EXECUTED,
    executionResult: { distributedUnits: 10000 },
    approvedBy: SYS_ADMIN,
    approvedAt: new Date('2026-03-10T09:00:00Z'),
    executedBy: SYS_ADMIN,
    executedAt: new Date('2026-03-15T09:00:00Z'),
    createdBy: SYS_ADMIN,
  },
];

const DISTRIBUTIONS: Array<Omit<Distribution, 'id' | 'productId' | 'createdAt' | 'product'>> = [
  {
    type: DistributionType.DIVIDEND,
    amountPerUnit: 15.5,
    totalPool: 3875000,
    recordDate: new Date('2026-03-31'),
    payDate: new Date('2026-04-15'),
    description: 'Q1 2026 dividend payment',
    status: DistributionStatus.EXECUTED,
    approvedBy: SYS_ADMIN,
    approvedAt: new Date('2026-04-10T09:00:00Z'),
    isPaid: true,
    createdBy: SYS_ADMIN,
  },
];

export async function seedInvestmentGovernance(dataSource: DataSource): Promise<void> {
  const productRepo = dataSource.getRepository(InvestmentProduct);
  const versionRepo = dataSource.getRepository(InvestmentProductVersion);
  const eligibilityRepo = dataSource.getRepository(InvestmentEligibilityRule);
  const pricingRepo = dataSource.getRepository(PricingConfig);
  const cycleRepo = dataSource.getRepository(ShareIssuanceCycle);
  const navRepo = dataSource.getRepository(NavSnapshot);
  const corporateRepo = dataSource.getRepository(CorporateAction);
  const distributionRepo = dataSource.getRepository(Distribution);

  const existing = await productRepo.count();
  if (existing > 0) {
    console.log('Investment governance data already seeded, skipping');
    return;
  }

  const growthSharesId: Record<string, string> = {};
  const fixedIncomeId: Record<string, string> = {};

  for (const seed of PRODUCTS) {
    const product = productRepo.create({
      name: seed.name,
      description: seed.description,
      type: seed.type,
      riskTier: seed.riskTier,
      minimumInvestment: seed.minimumInvestment,
      maximumInvestment: seed.maximumInvestment,
      unitPrice: seed.unitPrice,
      lockInDays: seed.lockInDays,
      tenorDays: seed.tenorDays,
      managementFeeRate: seed.managementFeeRate,
      expectedReturnRate: seed.expectedReturnRate,
      profitSharingRules: seed.profitSharingRules,
      distributionFrequency: seed.distributionFrequency,
      totalUnits: seed.totalUnits,
      availableUnits: seed.availableUnits,
      totalCapacity: seed.totalCapacity,
      currentCapacity: 0,
      perInvestorCaps: seed.perInvestorCaps,
      isOpen: true,
      status: ProductStatus.ACTIVE,
      version: 1,
      createdBy: SYS_ADMIN,
    });
    const saved = await productRepo.save(product);

    if (seed.name === 'Coop Growth Shares') growthSharesId.id = saved.id;
    if (seed.name === 'Fixed Income Deposit') fixedIncomeId.id = saved.id;

    await versionRepo.save(
      versionRepo.create({
        productId: saved.id,
        version: 1,
        snapshot: {
          name: saved.name,
          description: saved.description,
          type: saved.type,
          riskTier: saved.riskTier,
          minimumInvestment: Number(saved.minimumInvestment),
          maximumInvestment: saved.maximumInvestment ? Number(saved.maximumInvestment) : null,
          unitPrice: saved.unitPrice ? Number(saved.unitPrice) : null,
          lockInDays: saved.lockInDays,
          tenorDays: saved.tenorDays,
          managementFeeRate: Number(saved.managementFeeRate),
          expectedReturnRate: Number(saved.expectedReturnRate),
          profitSharingRules: saved.profitSharingRules,
          distributionFrequency: saved.distributionFrequency,
          totalUnits: saved.totalUnits,
          availableUnits: saved.availableUnits,
          isOpen: saved.isOpen,
          status: saved.status,
        },
        changeSummary: 'Initial creation',
        changedBy: SYS_ADMIN,
      }),
    );

    await eligibilityRepo.save(
      eligibilityRepo.create({
        productId: saved.id,
        kycRequiredLevel: seed.eligibility.kycRequiredLevel,
        requireMembership: seed.eligibility.requireMembership,
        allowedGeographies: seed.eligibility.allowedGeographies,
        accreditationRequired: seed.eligibility.accreditationRequired,
        investorWhitelist: null,
        investorBlacklist: null,
      }),
    );

    await pricingRepo.save(
      pricingRepo.create({
        productId: saved.id,
        formulaType: seed.pricing.formulaType,
        minUnitPrice: seed.pricing.minUnitPrice,
        maxUnitPrice: seed.pricing.maxUnitPrice,
        navSchedule: seed.pricing.navSchedule,
        allowCorporateActions: seed.pricing.allowCorporateActions,
        distributionApprovalRequired: seed.pricing.distributionApprovalRequired,
        accrualMethod: seed.pricing.accrualMethod,
      }),
    );
  }

  for (const cycle of ISSUANCE_CYCLES) {
    await cycleRepo.save(cycleRepo.create({ ...cycle, productId: growthSharesId.id }));
  }

  for (const nav of NAV_SNAPSHOTS) {
    await navRepo.save(navRepo.create({ ...nav, productId: growthSharesId.id }));
  }

  for (const action of CORPORATE_ACTIONS) {
    await corporateRepo.save(corporateRepo.create({ ...action, productId: growthSharesId.id }));
  }

  for (const dist of DISTRIBUTIONS) {
    await distributionRepo.save(distributionRepo.create({ ...dist, productId: growthSharesId.id }));
  }

  void fixedIncomeId;

  console.log(`Seeded ${PRODUCTS.length} investment products with eligibility, pricing, cycles, NAV, corporate actions and distributions`);
}
