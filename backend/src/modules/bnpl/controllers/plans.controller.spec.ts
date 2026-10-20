import { Role } from '../../../common/enums/role.enum';
import { PlansController } from './plans.controller';

describe('PlansController', () => {
  it('creates a global plan without taking organization ownership from the request', async () => {
    const service = { create: jest.fn().mockResolvedValue({ id: 'plan-1' }) };
    const controller = new PlansController(service as any);
    const dto = {
      organizationId: 'ignored-organization',
      catalogItemId: 'item-1',
      downPaymentPercent: 10,
      installmentCount: 6,
      installmentFrequency: 'monthly',
    };

    await (controller.create as any)(dto, 'admin-1');

    expect(service.create).toHaveBeenCalledWith({
      ...dto,
      organizationId: null,
      createdBy: 'admin-1',
    });
  });

  it('lists the shared plans without filtering by caller organization', async () => {
    const service = { findAllShared: jest.fn().mockResolvedValue([]) };
    const controller = new PlansController(service as any);

    await (controller.findAll as any)();

    expect(service.findAllShared).toHaveBeenCalledTimes(1);
  });
});