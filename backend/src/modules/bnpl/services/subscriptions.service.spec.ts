import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { SubscriptionsService } from './subscriptions.service';
import { InstallmentsService } from './installments.service';
import { BnplSubscription } from '../entities/bnpl-subscription.entity';
import { BnplInstallment } from '../entities/bnpl-installment.entity';
import { BnplPlan } from '../entities/bnpl-plan.entity';
import { BnplCatalogItem } from '../entities/bnpl-catalog-item.entity';
import { SubscriptionStatus, InstallmentStatus, PayoutStatus } from '../../../common/enums/status.enum';

describe('SubscriptionsService', () => {
  let service: SubscriptionsService;
  let planRepo: jest.Mocked<Repository<BnplPlan>>;
  let subRepo: jest.Mocked<Repository<BnplSubscription>>;
  let instRepo: jest.Mocked<Repository<BnplInstallment>>;

  const mockCatalogItem = { id: 'item-1', price: 100000 } as BnplCatalogItem;
  const mockPlan = {
    id: 'plan-1',
    catalogItemId: 'item-1',
    catalogItem: mockCatalogItem,
    downPaymentPercent: 20,
    installmentCount: 3,
    installmentFrequency: 'monthly',
    interestRate: 5,
    organizationId: 'org-1',
    status: 'active',
  } as BnplPlan;

  const mockSubscription = {
    id: 'sub-1',
    userId: 'user-1',
    planId: 'plan-1',
    status: SubscriptionStatus.CREATED,
    downPayment: 20000,
    totalAmount: 105000,
    amountPaid: 0,
    nextInstallmentDate: new Date(),
    payoutStatus: PayoutStatus.PENDING,
  } as BnplSubscription;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionsService,
        {
          provide: getRepositoryToken(BnplSubscription),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(BnplInstallment),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(BnplPlan),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SubscriptionsService>(SubscriptionsService);
    planRepo = module.get(getRepositoryToken(BnplPlan));
    subRepo = module.get(getRepositoryToken(BnplSubscription));
    instRepo = module.get(getRepositoryToken(BnplInstallment));
  });

  describe('subscribe', () => {
    it('should throw if plan not found', async () => {
      planRepo.findOne.mockResolvedValue(null);
      await expect(service.subscribe('user-1', 'invalid')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should create subscription with correct financials', async () => {
      planRepo.findOne.mockResolvedValue(mockPlan);
      subRepo.create.mockReturnValue(mockSubscription);
      subRepo.save.mockResolvedValue(mockSubscription);
      instRepo.create.mockReturnValue({} as BnplInstallment);
      instRepo.save.mockResolvedValue([]);

      const result = await service.subscribe('user-1', 'plan-1');

      expect(result.downPayment).toBe(20000);
      expect(result.totalAmount).toBe(105000);
      expect(result.payoutStatus).toBe(PayoutStatus.PENDING);
      expect(subRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          planId: 'plan-1',
          downPayment: 20000,
          totalAmount: 105000,
        }),
      );
    });

    it('should use catalogItem price when plan has relation loaded', async () => {
      planRepo.findOne.mockResolvedValue(mockPlan);
      subRepo.create.mockReturnValue(mockSubscription);
      subRepo.save.mockResolvedValue(mockSubscription);

      await service.subscribe('user-1', 'plan-1');

      expect(planRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'plan-1', status: 'active' },
        relations: { catalogItem: true },
      });
    });

    it('should generate correct number of installments', async () => {
      planRepo.findOne.mockResolvedValue(mockPlan);
      subRepo.create.mockReturnValue(mockSubscription);
      subRepo.save.mockResolvedValue(mockSubscription);
      const createSpy = instRepo.create.mockReturnValue({} as BnplInstallment);

      await service.subscribe('user-1', 'plan-1');

      expect(createSpy).toHaveBeenCalledTimes(3);
      expect(instRepo.save).toHaveBeenCalled();
    });
  });

  describe('findByUser', () => {
    it('should return subscriptions with relations', async () => {
      subRepo.find.mockResolvedValue([mockSubscription]);
      const results = await service.findByUser('user-1');
      expect(results).toHaveLength(1);
      expect(subRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1' },
          relations: { plan: { catalogItem: true }, installments: true },
        }),
      );
    });
  });

  describe('findById', () => {
    it('should throw if not found', async () => {
      subRepo.findOne.mockResolvedValue(null);
      await expect(service.findById('invalid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
