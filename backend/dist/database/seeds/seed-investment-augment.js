"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.augmentInvestmentGovernance = augmentInvestmentGovernance;
const investment_product_entity_1 = require("../../modules/investments/entities/investment-product.entity");
const share_issuance_cycle_entity_1 = require("../../modules/investments/entities/share-issuance-cycle.entity");
const nav_snapshot_entity_1 = require("../../modules/investments/entities/nav-snapshot.entity");
const distribution_entity_1 = require("../../modules/investments/entities/distribution.entity");
const corporate_action_entity_1 = require("../../modules/investments/entities/corporate-action.entity");
const SYS_ADMIN = '00000000-0000-0000-0000-000000000001';
const AUGMENT = [
    {
        productName: 'Fixed Income Deposit',
        cycles: [
            {
                cycleName: 'Fixed Income Subscription — July 2026',
                totalUnits: 500000,
                allocatedUnits: 250000,
                unitPrice: 100,
                totalValue: 50000000,
                openDate: new Date('2026-07-01'),
                closeDate: new Date('2026-07-31'),
                status: share_issuance_cycle_entity_1.CycleStatus.APPROVED,
                approvedBy: SYS_ADMIN,
                approvedAt: new Date('2026-06-30T09:00:00Z'),
                createdBy: SYS_ADMIN,
            },
        ],
        nav: [
            { nav: 100, unitPrice: 100, snapshotDate: new Date('2026-07-30'), createdBy: SYS_ADMIN },
            { nav: 100, unitPrice: 100, snapshotDate: new Date('2026-07-23'), createdBy: SYS_ADMIN },
            { nav: 100, unitPrice: 100, snapshotDate: new Date('2026-07-16'), createdBy: SYS_ADMIN },
        ],
        distributions: [
            {
                type: distribution_entity_1.DistributionType.INTEREST,
                amountPerUnit: 0.42,
                totalPool: 210000,
                recordDate: new Date('2026-07-31'),
                payDate: new Date('2026-08-05'),
                description: 'July 2026 interest payout',
                status: distribution_entity_1.DistributionStatus.EXECUTED,
                approvedBy: SYS_ADMIN,
                approvedAt: new Date('2026-08-01T09:00:00Z'),
                isPaid: true,
                createdBy: SYS_ADMIN,
            },
        ],
    },
    {
        productName: 'Pooled Micro-Investment',
        cycles: [
            {
                cycleName: 'Fundraising Cycle H1 2026',
                totalUnits: 50000,
                allocatedUnits: 12500,
                unitPrice: 500,
                totalValue: 25000000,
                openDate: new Date('2026-01-05'),
                closeDate: new Date('2026-03-31'),
                status: share_issuance_cycle_entity_1.CycleStatus.CLOSED,
                approvedBy: SYS_ADMIN,
                approvedAt: new Date('2026-01-04T09:00:00Z'),
                createdBy: SYS_ADMIN,
            },
        ],
        nav: [
            { nav: 512.4, unitPrice: 512.4, snapshotDate: new Date('2026-07-30'), createdBy: SYS_ADMIN },
            { nav: 506.15, unitPrice: 506.15, snapshotDate: new Date('2026-07-15'), createdBy: SYS_ADMIN },
            { nav: 500, unitPrice: 500, snapshotDate: new Date('2026-06-30'), createdBy: SYS_ADMIN },
        ],
        distributions: [
            {
                type: distribution_entity_1.DistributionType.PROFIT_SHARE,
                amountPerUnit: 24.5,
                totalPool: 3675000,
                recordDate: new Date('2026-03-31'),
                payDate: new Date('2026-04-20'),
                description: 'FY2025 profit share payout',
                status: distribution_entity_1.DistributionStatus.EXECUTED,
                approvedBy: SYS_ADMIN,
                approvedAt: new Date('2026-04-15T09:00:00Z'),
                isPaid: true,
                createdBy: SYS_ADMIN,
            },
        ],
        corporateActions: [
            {
                type: corporate_action_entity_1.CorporateActionType.BONUS,
                description: '1-for-25 bonus units',
                ratioNumerator: 1,
                ratioDenominator: 25,
                effectiveDate: new Date('2026-06-15'),
                status: corporate_action_entity_1.CorporateActionStatus.EXECUTED,
                executionResult: { distributedUnits: 2000 },
                approvedBy: SYS_ADMIN,
                approvedAt: new Date('2026-06-10T09:00:00Z'),
                executedBy: SYS_ADMIN,
                executedAt: new Date('2026-06-15T09:00:00Z'),
                createdBy: SYS_ADMIN,
            },
        ],
    },
    {
        productName: 'Youth Investment Plan',
        cycles: [
            {
                cycleName: 'Q3 2026 Youth Issuance',
                totalUnits: 100000,
                allocatedUnits: 0,
                unitPrice: 250,
                totalValue: 25000000,
                openDate: new Date('2026-07-01'),
                closeDate: new Date('2026-09-30'),
                status: share_issuance_cycle_entity_1.CycleStatus.APPROVED,
                approvedBy: SYS_ADMIN,
                approvedAt: new Date('2026-06-29T09:00:00Z'),
                createdBy: SYS_ADMIN,
            },
        ],
        nav: [
            { nav: 252.5, unitPrice: 252.5, snapshotDate: new Date('2026-07-30'), createdBy: SYS_ADMIN },
            { nav: 251.2, unitPrice: 251.2, snapshotDate: new Date('2026-07-16'), createdBy: SYS_ADMIN },
            { nav: 250, unitPrice: 250, snapshotDate: new Date('2026-06-30'), createdBy: SYS_ADMIN },
        ],
        distributions: [
            {
                type: distribution_entity_1.DistributionType.PROFIT_SHARE,
                amountPerUnit: 0.85,
                totalPool: 357000,
                recordDate: new Date('2026-06-30'),
                payDate: new Date('2026-07-05'),
                description: 'June 2026 monthly payout',
                status: distribution_entity_1.DistributionStatus.EXECUTED,
                approvedBy: SYS_ADMIN,
                approvedAt: new Date('2026-07-01T09:00:00Z'),
                isPaid: true,
                createdBy: SYS_ADMIN,
            },
        ],
    },
    {
        productName: 'Coop Growth Shares',
        distributions: [
            {
                type: distribution_entity_1.DistributionType.DIVIDEND,
                amountPerUnit: 12,
                totalPool: 3000000,
                recordDate: new Date('2026-06-30'),
                payDate: new Date('2026-07-31'),
                description: 'Q2 2026 dividend (approved, pending payment)',
                status: distribution_entity_1.DistributionStatus.APPROVED,
                approvedBy: SYS_ADMIN,
                approvedAt: new Date('2026-07-25T09:00:00Z'),
                isPaid: false,
                createdBy: SYS_ADMIN,
            },
        ],
        corporateActions: [
            {
                type: corporate_action_entity_1.CorporateActionType.SPLIT,
                description: '2-for-1 share split (pending)',
                ratioNumerator: 2,
                ratioDenominator: 1,
                effectiveDate: new Date('2026-08-15'),
                status: corporate_action_entity_1.CorporateActionStatus.PENDING,
                executionResult: null,
                approvedBy: null,
                approvedAt: null,
                executedBy: null,
                executedAt: null,
                createdBy: SYS_ADMIN,
            },
        ],
    },
];
async function augmentInvestmentGovernance(dataSource) {
    const productRepo = dataSource.getRepository(investment_product_entity_1.InvestmentProduct);
    const cycleRepo = dataSource.getRepository(share_issuance_cycle_entity_1.ShareIssuanceCycle);
    const navRepo = dataSource.getRepository(nav_snapshot_entity_1.NavSnapshot);
    const distRepo = dataSource.getRepository(distribution_entity_1.Distribution);
    const corporateRepo = dataSource.getRepository(corporate_action_entity_1.CorporateAction);
    let addedCycles = 0;
    let addedNav = 0;
    let addedDist = 0;
    let addedCorp = 0;
    for (const spec of AUGMENT) {
        const product = await productRepo.findOne({ where: { name: spec.productName } });
        if (!product) {
            console.log(`Augment skip: product not found "${spec.productName}"`);
            continue;
        }
        if (spec.cycles) {
            for (const cycle of spec.cycles) {
                const existing = await cycleRepo.findOne({ where: { productId: product.id, cycleName: cycle.cycleName } });
                if (!existing) {
                    await cycleRepo.save(cycleRepo.create({ ...cycle, productId: product.id }));
                    addedCycles++;
                }
            }
        }
        if (spec.nav) {
            for (const snap of spec.nav) {
                const existing = await navRepo.findOne({ where: { productId: product.id, snapshotDate: snap.snapshotDate } });
                if (!existing) {
                    await navRepo.save(navRepo.create({ ...snap, productId: product.id }));
                    addedNav++;
                }
            }
        }
        if (spec.distributions) {
            for (const dist of spec.distributions) {
                const existing = await distRepo.findOne({ where: { productId: product.id, description: dist.description ?? '' } });
                if (!existing) {
                    await distRepo.save(distRepo.create({ ...dist, productId: product.id }));
                    addedDist++;
                }
            }
        }
        if (spec.corporateActions) {
            for (const action of spec.corporateActions) {
                const existing = await corporateRepo.findOne({ where: { productId: product.id, description: action.description ?? '' } });
                if (!existing) {
                    await corporateRepo.save(corporateRepo.create({ ...action, productId: product.id }));
                    addedCorp++;
                }
            }
        }
    }
    console.log(`Augmented investment governance: +${addedCycles} cycles, +${addedNav} NAV snapshots, +${addedDist} distributions, +${addedCorp} corporate actions`);
}
//# sourceMappingURL=seed-investment-augment.js.map