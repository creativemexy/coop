import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DashboardService } from './dashboard.service';
import { UsersService } from '../users/users.service';
import { SubscriptionsService } from '../bnpl/services/subscriptions.service';
import { FeePotService } from '../ledger/services/fee-pot.service';
import { User } from '../users/entities/user.entity';
import { ApexOrganization } from '../apex-organizations/entities/apex-organization.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { BnplPlan } from '../bnpl/entities/bnpl-plan.entity';
import { BnplCatalogItem } from '../bnpl/entities/bnpl-catalog-item.entity';
import { BnplSubscription } from '../bnpl/entities/bnpl-subscription.entity';
import { BnplInstallment } from '../bnpl/entities/bnpl-installment.entity';
import { Payment } from '../payments/entities/payment.entity';
import { JournalEntry } from '../ledger/entities/journal-entry.entity';
import { FeePot } from '../ledger/entities/fee-pot.entity';
import { KycStatus, InstallmentStatus } from '../../common/enums/status.enum';

describe('DashboardService', () => {
  let service: DashboardService;
  let usersService: UsersService;
  let userRepo: jest.Mocked<Repository<User>>;
  let apexRepo: jest.Mocked<Repository<ApexOrganization>>;
  let orgRepo: jest.Mocked<Repository<Organization>>;
  let subscriptionRepo: jest.Mocked<Repository<BnplSubscription>>;

  const mockQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    getRawOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: getRepositoryToken(User),
          useValue: { count: jest.fn(), find: jest.fn() },
        },
        {
          provide: getRepositoryToken(ApexOrganization),
          useValue: { count: jest.fn() },
        },
        {
          provide: getRepositoryToken(Organization),
          useValue: { count: jest.fn() },
        },
        {
          provide: getRepositoryToken(BnplPlan),
          useValue: { find: jest.fn() },
        },
        {
          provide: getRepositoryToken(BnplCatalogItem),
          useValue: { count: jest.fn() },
        },
        {
          provide: getRepositoryToken(BnplSubscription),
          useValue: {
            count: jest.fn(),
            find: jest.fn(),
            createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
          },
        },
        {
          provide: getRepositoryToken(BnplInstallment),
          useValue: {
            createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
          },
        },
        {
          provide: getRepositoryToken(Payment),
          useValue: {
            createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
          },
        },
        {
          provide: getRepositoryToken(JournalEntry),
          useValue: { count: jest.fn() },
        },
        {
          provide: getRepositoryToken(FeePot),
          useValue: {
            createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
          },
        },
        {
          provide: UsersService,
          useValue: { findById: jest.fn() },
        },
        {
          provide: SubscriptionsService,
          useValue: { findByUser: jest.fn() },
        },
        {
          provide: FeePotService,
          useValue: { getPots: jest.fn(), getFeeShareLedger: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    usersService = module.get<UsersService>(UsersService);
    userRepo = module.get(getRepositoryToken(User));
    apexRepo = module.get(getRepositoryToken(ApexOrganization));
    orgRepo = module.get(getRepositoryToken(Organization));
    subscriptionRepo = module.get(getRepositoryToken(BnplSubscription));
  });

  describe('getSuperAdminDashboard', () => {
    it('should return aggregated counts and sums', async () => {
      apexRepo.count.mockResolvedValue(2);
      orgRepo.count.mockResolvedValue(5);
      userRepo.count.mockResolvedValue(100);
      mockQueryBuilder.getRawOne
        .mockResolvedValueOnce({ total: '500000' })
        .mockResolvedValueOnce({ total: '2000000' });

      const result = await service.getSuperAdminDashboard();
      expect(result.totalApexOrgs).toBe(2);
      expect(result.totalOrganizations).toBe(5);
      expect(result.totalUsers).toBe(100);
      expect(result.totalRevenue).toBe(500000);
      expect(result.bnplVolume).toBe(2000000);
    });
  });

  describe('getIndividualDashboard', () => {
    it('should return user-specific dashboard', async () => {
      const mockUser = {
        id: 'user-1',
        kycStatus: KycStatus.APPROVED,
      };
      (usersService.findById as jest.Mock).mockResolvedValue(mockUser);

      subscriptionRepo.find.mockResolvedValue([
        {
          id: 'sub-1',
          status: 'active',
          installments: [
            {
              id: 'inst-1',
              status: InstallmentStatus.PENDING,
              dueDate: new Date('2026-08-01'),
              amount: 5000,
            },
            {
              id: 'inst-2',
              status: InstallmentStatus.PAID,
              dueDate: new Date('2026-07-01'),
              amount: 5000,
            },
          ],
        },
      ] as any);

      const result = await service.getIndividualDashboard('user-1');
      expect(result.kycStatus).toBe(KycStatus.APPROVED);
      expect(result.activeSubscriptions).toBe(1);
      expect(result.nextPaymentAmount).toBe(5000);
    });
  });
});
