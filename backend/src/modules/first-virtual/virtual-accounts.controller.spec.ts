import { VirtualAccountsController } from './virtual-accounts.controller';

describe('VirtualAccountsController', () => {
  it('does not provision or return a reusable member account', async () => {
    const service = { getForUser: jest.fn() };
    const controller = new VirtualAccountsController(service as any);

    await expect(controller.getMine('member-1')).resolves.toBeNull();
    expect(service.getForUser).not.toHaveBeenCalled();
  });
});