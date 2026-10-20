import { DueDateRule, BnplPlanConfig } from '../entities/bnpl-plan-config.entity';
import { SubscriptionStatus } from '../../../common/enums/status.enum';
import { ProcessingEngineService } from './processing-engine.service';

jest.mock('uuid', () => ({ v4: () => 'test-uuid' }));

describe('ProcessingEngineService shared plans', () => {
  it('uses the subscription organization config during disbursement', async () => {
    const subscription = {
      id: 'subscription-1',
      userId: 'user-1',
      organizationId: 'org-member',
      planId: 'plan-1',
      status: SubscriptionStatus.PENDING_PAYMENT,
      totalAmount: 200,
      amountPaid: 0,
    };
    const configRepo = {
      findOne: jest.fn().mockResolvedValue({
        organizationId: 'org-member',
        dueDateRule: DueDateRule.END_OF_MONTH,
        gracePeriodDays: 2,
      } as Partial<BnplPlanConfig>),
    };
    const stepRepo = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn((step) => ({ id: 'step-1', ...step })),
      save: jest.fn(async (step) => step),
    };
    const instRepo = {
      save: jest.fn(async (installments) => installments),
    };
    const subRepo = {
      findOne: jest.fn().mockResolvedValue(subscription),
      save: jest.fn(async (value) => value),
    };
    const idempotencyRepo = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => value),
    };
    const planRepo = {
      findOne: jest.fn().mockResolvedValue({
        id: 'plan-1',
        organizationId: null,
        catalogItem: { price: 100 },
        downPaymentPercent: 10,
        installmentCount: 2,
        installmentFrequency: 'monthly',
      }),
    };
    const service = new ProcessingEngineService(
      stepRepo as any,
      idempotencyRepo as any,
      subRepo as any,
      instRepo as any,
      planRepo as any,
      configRepo as any,
    );

    await service.executeDisbursement('subscription-1', 'DISB-1', 'idem-1');

    expect(configRepo.findOne).toHaveBeenCalledWith({
      where: { organizationId: 'org-member' },
    });
  });
});
