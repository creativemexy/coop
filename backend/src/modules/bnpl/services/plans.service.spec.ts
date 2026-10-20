import { PlanStatus } from '../entities/bnpl-plan.entity';
import { PlansService } from './plans.service';

describe('PlansService', () => {
  it('returns active global plans rather than plans scoped to one organization', async () => {
    const plan = { id: 'plan-1', organizationId: null, status: PlanStatus.ACTIVE };
    const repository = { find: jest.fn().mockResolvedValue([plan]) };
    const service = new PlansService(repository as any, {} as any);

    await expect(service.findAllShared()).resolves.toEqual([plan]);
    expect(repository.find).toHaveBeenCalledWith({
      where: { status: PlanStatus.ACTIVE },
      relations: { catalogItem: true },
      order: { createdAt: 'DESC' },
    });
  });
});
