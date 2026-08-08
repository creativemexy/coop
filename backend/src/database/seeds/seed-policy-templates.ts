import { DataSource } from 'typeorm';
import {
  PolicyTemplate,
  PolicyTemplateType,
  PolicyTemplateStatus,
} from '../../modules/admin/entities/policy-template.entity';

const SYS_ADMIN = '00000000-0000-0000-0000-000000000001';
const APPROVED_AT = new Date('2026-06-15T09:30:00.000Z');

interface PolicySeed {
  name: string;
  description: string;
  templateType: PolicyTemplateType;
  status: PolicyTemplateStatus;
  version: number;
  rules: Record<string, any>;
  metadata: Record<string, any>;
  changeSummary?: string;
  parentTemplateId?: string;
  supersededBy?: string;
}

const POLICY_SEEDS: PolicySeed[] = [
  // ─── bnpl_product ─────────────────────────────────────────────
  {
    name: 'Standard BNPL Product Approval Policy',
    description:
      'Governs the creation, configuration and launch of BNPL products across all tenants. Any new product or material change to tenor, pricing or limits requires a reviewed template before going live.',
    templateType: PolicyTemplateType.BNPL_PRODUCT,
    status: PolicyTemplateStatus.ACTIVE,
    version: 1,
    rules: {
      minTenorDays: 14,
      maxTenorDays: 365,
      maxLoanAmount: 500000,
      minDownPaymentRate: 0.05,
      productApprovalRequired: true,
      refundsWithinDays: 7,
      maxProductsPerTenant: 25,
      changeWindowFreezeDays: 3,
    },
    metadata: {
      ownerDepartment: 'Product Governance',
      effectiveDate: '2026-01-10',
      reviewCadenceMonths: 6,
      regulatoryRef: 'CBN-GLC-2026/07',
    },
  },
  {
    name: 'BNPL Product Sunset & Delisting Policy',
    description:
      'Defines the controlled deactivation of BNPL products, including customer notification windows, pending-order handling and re-activation criteria.',
    templateType: PolicyTemplateType.BNPL_PRODUCT,
    status: PolicyTemplateStatus.DRAFT,
    version: 1,
    rules: {
      delistingNoticeDays: 30,
      pendingOrdersWindowDays: 7,
      autoPauseOnRiskScore: 700,
      reactivationRequiresApproval: true,
      customerNotificationChannels: ['sms', 'email', 'in-app'],
    },
    metadata: {
      ownerDepartment: 'Product Governance',
      effectiveDate: null,
      reviewCadenceMonths: 6,
    },
  },
  {
    name: 'Supplement Lending Exposure Cap Policy',
    description:
      'Legacy draft setting hard exposure caps for secondary/supplement lending. Rejected during review due to insufficient risk controls and missing board sign-off.',
    templateType: PolicyTemplateType.BNPL_PRODUCT,
    status: PolicyTemplateStatus.REJECTED,
    version: 1,
    rules: {
      supplementLoanCap: 150000,
      maxConcurrentLoans: 2,
      combinedUtilisationCap: 0.6,
    },
    metadata: {
      ownerDepartment: 'Risk',
      effectiveDate: null,
    },
    changeSummary: 'Rejected: insufficient risk controls and missing board sign-off.',
  },

  // ─── kyc_requirement ──────────────────────────────────────────
  {
    name: 'Tier-1 Basic KYC Policy',
    description:
      'Baseline identity verification for low-value onboarding. Establishes the minimum identity documents and transaction limits for basic accounts.',
    templateType: PolicyTemplateType.KYC_REQUIREMENT,
    status: PolicyTemplateStatus.SUPERSEDED,
    version: 1,
    rules: {
      kycLevel: 'basic',
      idTypes: ['BVN'],
      livenessCheck: false,
      addressVerification: false,
      maxMonthlyTransactions: 10,
      maxSingleTransaction: 50000,
      maxCumulativeBalance: 500000,
    },
    metadata: {
      ownerDepartment: 'Compliance',
      effectiveDate: '2025-09-01',
      reviewCadenceMonths: 12,
    },
  },
  {
    name: 'Tier-1 Basic KYC Policy (v2)',
    description:
      'Updated Tier-1 baseline requiring NIN alongside BVN and adding liveness verification, reflecting the enhanced verification framework rolled out this year.',
    templateType: PolicyTemplateType.KYC_REQUIREMENT,
    status: PolicyTemplateStatus.ACTIVE,
    version: 2,
    rules: {
      kycLevel: 'basic',
      idTypes: ['BVN', 'NIN'],
      livenessCheck: true,
      addressVerification: false,
      maxMonthlyTransactions: 20,
      maxSingleTransaction: 100000,
      maxCumulativeBalance: 1000000,
    },
    metadata: {
      ownerDepartment: 'Compliance',
      effectiveDate: '2026-05-01',
      reviewCadenceMonths: 12,
    },
    changeSummary: 'Added NIN as a mandatory ID type and enabled liveness verification.',
  },
  {
    name: 'Tier-2 Standard KYC Policy',
    description:
      'Standard verification tier for mid-value onboarding, requiring government-issued photo ID, liveness check and physical address confirmation.',
    templateType: PolicyTemplateType.KYC_REQUIREMENT,
    status: PolicyTemplateStatus.ACTIVE,
    version: 1,
    rules: {
      kycLevel: 'standard',
      idTypes: ['NIN', 'BVN', 'PASSPORT', 'DRIVERS_LICENSE'],
      livenessCheck: true,
      addressVerification: true,
      reVerificationMonths: 24,
      maxMonthlyTransactions: 50,
      maxCumulativeBalance: 5000000,
    },
    metadata: {
      ownerDepartment: 'Compliance',
      effectiveDate: '2026-02-15',
      reviewCadenceMonths: 12,
    },
  },
  {
    name: 'Enhanced Due Diligence (EDD) Policy',
    description:
      'Heightened scrutiny for high-value or flagged customers, defining the triggers and documentation required before elevated limits are granted.',
    templateType: PolicyTemplateType.KYC_REQUIREMENT,
    status: PolicyTemplateStatus.ACTIVE,
    version: 1,
    rules: {
      kycLevel: 'enhanced',
      triggers: {
        singleTransactionAbove: 5000000,
        thirdPartyTransfersWithin30Days: 2,
        sanctionedFlag: true,
        politicallyExposedPerson: true,
      },
      requiredDocumentation: ['utility-bill', 'bank-statement-6months', 'proof-of-business'],
      reVerificationMonths: 6,
      requiresComplianceOfficerApproval: true,
    },
    metadata: {
      ownerDepartment: 'Compliance',
      effectiveDate: '2026-03-01',
      reviewCadenceMonths: 6,
    },
  },

  // ─── manager_action ───────────────────────────────────────────
  {
    name: 'Loan Disbursement Approval Policy',
    description:
      'Defines approval thresholds and dual-control requirements for loan disbursements, ensuring larger advances receive commensurate review.',
    templateType: PolicyTemplateType.MANAGER_ACTION,
    status: PolicyTemplateStatus.ACTIVE,
    version: 1,
    rules: {
      approvalRequiredAbove: 200000,
      maxApprovalTier: 1,
      dualApprovalAbove: 1000000,
      disbursementWindowHours: 24,
      sameDayDisbursementBelow: 50000,
      approverRotationRequired: true,
    },
    metadata: {
      ownerDepartment: 'Operations',
      effectiveDate: '2026-01-20',
      reviewCadenceMonths: 6,
    },
  },
  {
    name: 'Charge-Off & Write-Off Policy',
    description:
      'Sets the aging thresholds and approval chain for charging off and writing off delinquent loans, including board-level sign-off requirements.',
    templateType: PolicyTemplateType.MANAGER_ACTION,
    status: PolicyTemplateStatus.PENDING_APPROVAL,
    version: 1,
    rules: {
      chargeOffAfterDays: 120,
      writeOffAfterDays: 365,
      partialChargeOffRate: 0.3,
      boardApprovalRequired: true,
      recoveryTrackingAfterWriteOff: true,
      quarterlyReconciliationRequired: true,
    },
    metadata: {
      ownerDepartment: 'Credit & Collections',
      effectiveDate: null,
      reviewCadenceMonths: 12,
    },
  },

  // ─── interest_rate ────────────────────────────────────────────
  {
    name: 'Risk-Based Interest Rate Pricing Policy',
    description:
      'Bounds the annual interest rates chargeable on BNPL facilities and ties the maximum allowed rate to the customer risk score band.',
    templateType: PolicyTemplateType.INTEREST_RATE,
    status: PolicyTemplateStatus.ACTIVE,
    version: 1,
    rules: {
      annualRateMin: 0.05,
      annualRateMax: 0.36,
      riskBasedPricing: true,
      rateTiers: [
        { riskScoreAbove: 700, maxAnnualRate: 0.24 },
        { riskScoreAbove: 600, maxAnnualRate: 0.3 },
        { riskScoreAbove: 0, maxAnnualRate: 0.36 },
      ],
      lateFeeRate: 0.05,
      maxLateFeeCap: 20000,
      rateChangeNoticeDays: 14,
    },
    metadata: {
      ownerDepartment: 'Pricing & Analytics',
      effectiveDate: '2026-02-01',
      reviewCadenceMonths: 6,
    },
  },
  {
    name: 'Promotional Rate Policy',
    description:
      'Governs discounted promotional interest rates, limiting their duration, depth and customer eligibility to keep campaigns within budget.',
    templateType: PolicyTemplateType.INTEREST_RATE,
    status: PolicyTemplateStatus.ACTIVE,
    version: 1,
    rules: {
      promoRateMin: 0.0,
      promoRateMax: 0.05,
      maxPromoDurationDays: 90,
      appliesToNewCustomersOnly: true,
      budgetPerPromo: 5000000,
      requiresMarketingApproval: true,
      noStackingWithOtherPromos: true,
    },
    metadata: {
      ownerDepartment: 'Growth & Marketing',
      effectiveDate: '2026-04-01',
      reviewCadenceMonths: 6,
    },
  },
  {
    name: 'Default Rate & Penalty Interest Policy',
    description:
      'Defines the premium applied once an account enters default and the maximum allowable penalty rate, including compounding behaviour.',
    templateType: PolicyTemplateType.INTEREST_RATE,
    status: PolicyTemplateStatus.ACTIVE,
    version: 1,
    rules: {
      defaultRatePremium: 0.1,
      penaltyAppliesAfterDays: 30,
      maxDefaultRate: 0.6,
      compoundingInterval: 'monthly',
      penaltyCapAsMultipleOfPrincipal: 1.5,
    },
    metadata: {
      ownerDepartment: 'Credit & Collections',
      effectiveDate: '2026-01-15',
      reviewCadenceMonths: 12,
    },
  },

  // ─── collection ───────────────────────────────────────────────
  {
    name: 'First-Party Collection Policy',
    description:
      'Sets the outreach cadence, channels and escalation timeline for recovering overdue balances in-house before any external action.',
    templateType: PolicyTemplateType.COLLECTION,
    status: PolicyTemplateStatus.ACTIVE,
    version: 1,
    rules: {
      earlyReminderDay: 5,
      firstContactDay: 1,
      contactAttempts: { phone: 7, email: 3, sms: 5 },
      allowedChannels: ['sms', 'email', 'phone', 'in-app'],
      fieldVisitDay: 45,
      forbearanceAllowedAfter: 60,
      collectionHours: { start: '08:00', end: '20:00' },
    },
    metadata: {
      ownerDepartment: 'Collections',
      effectiveDate: '2026-03-10',
      reviewCadenceMonths: 6,
    },
  },
  {
    name: 'Collections Outsourcing Policy',
    description:
      'Authorises and constrains the use of licensed third-party collection agencies for aged debt, including data-sharing and escalation rules.',
    templateType: PolicyTemplateType.COLLECTION,
    status: PolicyTemplateStatus.PENDING_APPROVAL,
    version: 1,
    rules: {
      outsourcingThresholdDays: 90,
      requiresLicensedAgency: true,
      dataShareMasked: true,
      agencyFeeCap: 0.1,
      complaintEscalationDays: 5,
      annualAgencyAuditRequired: true,
    },
    metadata: {
      ownerDepartment: 'Collections',
      effectiveDate: null,
      reviewCadenceMonths: 12,
    },
  },
];

export async function seedPolicyTemplates(dataSource: DataSource): Promise<void> {
  const policyRepo = dataSource.getRepository(PolicyTemplate);

  const existing = await policyRepo.count();
  if (existing > 0) {
    console.log('Policy templates already seeded, skipping');
    return;
  }

  const byName = new Map<string, PolicyTemplate>();

  for (const seed of POLICY_SEEDS) {
    const template = policyRepo.create({
      name: seed.name,
      description: seed.description,
      templateType: seed.templateType,
      status: seed.status,
      version: seed.version,
      rules: seed.rules,
      metadata: seed.metadata,
      changeSummary: seed.changeSummary,
      createdBy: SYS_ADMIN,
      isApplicableToAllTenants: true,
      applicableTenantIds: [],
      ...(seed.status === PolicyTemplateStatus.ACTIVE
        ? { approvedBy: SYS_ADMIN, approvedAt: APPROVED_AT }
        : {}),
    });
    await policyRepo.save(template);
    byName.set(seed.name, template);
  }

  const tier1 = byName.get('Tier-1 Basic KYC Policy');
  const tier1v2 = byName.get('Tier-1 Basic KYC Policy (v2)');
  if (tier1 && tier1v2) {
    tier1v2.parentTemplateId = tier1.id;
    await policyRepo.save(tier1v2);
    await policyRepo.update(tier1.id, { supersededBy: tier1v2.id });
  }

  console.log(`Seeded ${POLICY_SEEDS.length} policy templates`);
}
