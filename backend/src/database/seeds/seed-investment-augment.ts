import { DataSource } from 'typeorm';
import { InvestmentProduct } from '../../modules/investments/entities/investment-product.entity';
import { ShareIssuanceCycle, CycleStatus } from '../../modules/investments/entities/share-issuance-cycle.entity';
import { NavSnapshot } from '../../modules/investments/entities/nav-snapshot.entity';
import { Distribution, DistributionType, DistributionStatus } from '../../modules/investments/entities/distribution.entity';
import { CorporateAction, CorporateActionType, CorporateActionStatus } from '../../modules/investments/entities/corporate-action.entity';

const SYS_ADMIN = '00000000-0000-0000-0000-000000000001';

interface AugmentSpec {
  productName: string;
  cycles?: Array<Omit<ShareIssuanceCycle, 'id' | 'product' | 'productId' | 'createdAt' | 'updatedAt'>>;
  nav?: Array<Omit<NavSnapshot, 'id' | 'productId' | 'createdAt'>>;
  distributions?: Array<Omit<Distribution, 'id' | 'productId' | 'createdAt' | 'product'>>;
  corporateActions?: Array<Omit<CorporateAction, 'id' | 'productId' | 'createdAt' | 'updatedAt' | 'product'>>;
}

const AUGMENT: AugmentSpec[] = [
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
        status: CycleStatus.APPROVED,
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
        type: DistributionType.INTEREST,
        amountPerUnit: 0.42,
        totalPool: 210000,
        recordDate: new Date('2026-07-31'),
        payDate: new Date('2026-08-05'),
        description: 'July 2026 interest payout',
        status: DistributionStatus.EXECUTED,
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
        status: CycleStatus.CLOSED,
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
        type: DistributionType.PROFIT_SHARE,
        amountPerUnit: 24.5,
        totalPool: 3675000,
        recordDate: new Date('2026-03-31'),
        payDate: new Date('2026-04-20'),
        description: 'FY2025 profit share payout',
        status: DistributionStatus.EXECUTED,
        approvedBy: SYS_ADMIN,
        approvedAt: new Date('2026-04-15T09:00:00Z'),
        isPaid: true,
        createdBy: SYS_ADMIN,
      },
    ],
    corporateActions: [
      {
        type: CorporateActionType.BONUS,
        description: '1-for-25 bonus units',
        ratioNumerator: 1,
        ratioDenominator: 25,
        effectiveDate: new Date('2026-06-15'),
        status: CorporateActionStatus.EXECUTED,
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
        status: CycleStatus.APPROVED,
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
        type: DistributionType.PROFIT_SHARE,
        amountPerUnit: 0.85,
        totalPool: 357000,
        recordDate: new Date('2026-06-30'),
        payDate: new Date('2026-07-05'),
        description: 'June 2026 monthly payout',
        status: DistributionStatus.EXECUTED,
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
        type: DistributionType.DIVIDEND,
        amountPerUnit: 12,
        totalPool: 3000000,
        recordDate: new Date('2026-06-30'),
        payDate: new Date('2026-07-31'),
        description: 'Q2 2026 dividend (approved, pending payment)',
        status: DistributionStatus.APPROVED,
        approvedBy: SYS_ADMIN,
        approvedAt: new Date('2026-07-25T09:00:00Z'),
        isPaid: false,
        createdBy: SYS_ADMIN,
      },
    ],
    corporateActions: [
      {
        type: CorporateActionType.SPLIT,
        description: '2-for-1 share split (pending)',
        ratioNumerator: 2,
        ratioDenominator: 1,
        effectiveDate: new Date('2026-08-15'),
        status: CorporateActionStatus.PENDING,
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

export async function augmentInvestmentGovernance(dataSource: DataSource): Promise<void> {
  const productRepo = dataSource.getRepository(InvestmentProduct);
  const cycleRepo = dataSource.getRepository(ShareIssuanceCycle);
  const navRepo = dataSource.getRepository(NavSnapshot);
  const distRepo = dataSource.getRepository(Distribution);
  const corporateRepo = dataSource.getRepository(CorporateAction);

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
        const existing = await distRepo.findOne({ where: { productId: product.id, description: dist.description ?? '' } as any });
        if (!existing) {
          await distRepo.save(distRepo.create({ ...dist, productId: product.id }));
          addedDist++;
        }
      }
    }

    if (spec.corporateActions) {
      for (const action of spec.corporateActions) {
        const existing = await corporateRepo.findOne({ where: { productId: product.id, description: action.description ?? '' } as any });
        if (!existing) {
          await corporateRepo.save(corporateRepo.create({ ...action, productId: product.id }));
          addedCorp++;
        }
      }
    }
  }

  console.log(`Augmented investment governance: +${addedCycles} cycles, +${addedNav} NAV snapshots, +${addedDist} distributions, +${addedCorp} corporate actions`);
}
