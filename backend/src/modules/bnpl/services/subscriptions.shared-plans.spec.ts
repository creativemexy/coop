import { KycStatus } from '../../../common/enums/status.enum';
import { BnplPlan } from '../entities/bnpl-plan.entity';
import { SubscriptionsService } from './subscriptions.service';

describe('SubscriptionsService shared plans', () => {
  const createService = (organizationConfig: any, user: any) => {
    const configRepo = { findOne: jest.fn().mockResolvedValue(organizationConfig) };
    const userService = { findById: jest.fn().mockResolvedValue(user) };
    const subRepo = {
      create: jest.fn((subscription) => subscription),
      save: jest.fn(async (subscription) => subscription),
    };
    const planRepo = {
      findOne: jest.fn().mockResolvedValue({
        id: 'plan-1',
        catalogItem: { price: 400000 },
        organizationId: null,
        minPrincipal: null,
        maxPrincipal: null,
        eligibilityBands: null,
        status: 'active',
      } as Partial<BnplPlan>),
    };
    const service = new SubscriptionsService(
      subRepo as any,
      {} as any,
      planRepo as any,
      configRepo as any,
      {} as any,
      userService as any,
    );
    return { service, configRepo, subRepo };
  };

  it("uses the applicant's organization config for a global plan", async () => {
    const { service, configRepo } = createService(
      {
        organizationId: 'org-member',
        maxPrincipal: 500000,
        requireMembership: true,
      },
      {
        id: 'user-1',
        organizationId: 'org-member',
        kycStatus: KycStatus.APPROVED,
        kycVerifiedAt: new Date(),
      },
    );

    await expect(service.checkEligibility('user-1', 'plan-1')).resolves.toMatchObject({
      eligible: true,
    });
    expect(configRepo.findOne).toHaveBeenCalledWith({
      where: { organizationId: 'org-member' },
    });
  });

  it('rejects an individual whose KYC is not approved', async () => {
    const { service, configRepo } = createService(null, {
      id: 'user-1',
      organizationId: 'org-member',
      kycStatus: KycStatus.PENDING,
      kycVerifiedAt: null,
    });

    await expect(service.checkEligibility('user-1', 'plan-1')).resolves.toMatchObject({
      eligible: false,
      reasons: [expect.objectContaining({ key: 'kyc', passed: false })],
    });
    expect(configRepo.findOne).not.toHaveBeenCalled();
  });

  it('stores the applicant organization on a subscription to a global plan', async () => {
    const { service, subRepo, configRepo } = createService(
      {
        organizationId: 'org-member',
        maxPrincipal: 500000,
      },
      {
        id: 'user-1',
        organizationId: 'org-member',
        kycStatus: KycStatus.APPROVED,
        kycVerifiedAt: new Date(),
      },
    );

    const subscription = await service.subscribe('user-1', 'plan-1');

    expect(subscription.organizationId).toBe('org-member');
    expect(subRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        planId: 'plan-1',
        organizationId: 'org-member',
      }),
    );
    expect(configRepo.findOne).toHaveBeenCalledWith({
      where: { organizationId: 'org-member' },
    });
  });

  it('rejects an expired KYC verification', async () => {
    const { service } = createService(null, {
      id: 'user-1',
      organizationId: 'org-member',
      kycStatus: KycStatus.APPROVED,
      kycVerifiedAt: new Date(Date.now() - 366 * 24 * 60 * 60 * 1000),
    });

    await expect(service.checkEligibility('user-1', 'plan-1')).resolves.toMatchObject({
      eligible: false,
      reasons: [expect.objectContaining({ key: 'kyc', passed: false })],
    });
  });

  it('filters organization reports by subscription organization', async () => {
    const queryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    };
    const subRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    };
    const service = new SubscriptionsService(
      subRepo as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );

    await service.findByOrg('org-member');

    expect(queryBuilder.where).toHaveBeenCalledWith(
      'sub.organizationId = :orgId',
      { orgId: 'org-member' },
    );
  });
});
