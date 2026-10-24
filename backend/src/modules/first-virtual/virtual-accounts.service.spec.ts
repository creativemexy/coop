import { Logger } from '@nestjs/common';
import { VirtualAccountsService } from './virtual-accounts.service';
import { PendingDeposit } from './entities/pending-deposit.entity';

describe('VirtualAccountsService.verifyDeposit', () => {
  const deposit = (): PendingDeposit =>
    ({
      id: 'dep-1',
      userId: 'user-1',
      reference: 'FCSV-1',
      bankReference: 'TX-1',
      accountNumber: '9101725955',
      token: 'va-token',
      amount: 5000,
      type: 'general',
      status: 'pending',
      expiresAt: new Date(Date.now() + 60_000),
    }) as unknown as PendingDeposit;

  function build(client: Record<string, jest.Mock>) {
    const pendingRepo = {
      findOne: jest.fn().mockResolvedValue(deposit()),
      update: jest.fn().mockResolvedValue(undefined),
    };
    const savingsService = {
      applyExternalDeposit: jest.fn().mockResolvedValue({}),
    };
    const service = new VirtualAccountsService(
      pendingRepo as never,
      { findOne: jest.fn().mockResolvedValue(null) } as never,
      { isStubbed: jest.fn().mockReturnValue(false), ...client } as never,
      savingsService as never,
      {} as never,
      {} as never,
      { get: jest.fn() } as never,
      {} as never,
      { create: jest.fn().mockResolvedValue(undefined) } as never,
    );
    return { service, pendingRepo, savingsService };
  }

  let logSpy: jest.SpyInstance;
  beforeEach(() => {
    logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'debug').mockImplementation();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
  });
  afterEach(() => jest.restoreAllMocks());

  it('does not credit while the gateway has no transfer, and logs the reason once', async () => {
    const { service, savingsService } = build({
      confirmPayWithTransfer: jest.fn().mockResolvedValue({
        confirmed: false,
        paymentStatus: 'NotFound',
        message: 'No successful transaction record for this account',
      }),
      queryTransaction: jest.fn().mockResolvedValue({ status: 'PENDING' }),
    });

    await service.verifyDeposit('user-1', 'dep-1');
    await service.verifyDeposit('user-1', 'dep-1');

    expect(savingsService.applyExternalDeposit).not.toHaveBeenCalled();
    const pendingLogs = (logSpy.mock.calls as unknown[][])
      .map((c) => String(c[0]))
      .filter((line) => line.includes('is pending'));
    expect(pendingLogs).toHaveLength(1);
    expect(pendingLogs[0]).toContain('NotFound');
    expect(pendingLogs[0]).toContain('transaction status PENDING');
  });

  it('credits the instructed amount when Query Transaction reports SUCCESS', async () => {
    const queryTransaction = jest
      .fn()
      .mockResolvedValue({ status: 'SUCCESS', amount: 500000 });
    const { service, savingsService, pendingRepo } = build({
      confirmPayWithTransfer: jest
        .fn()
        .mockResolvedValue({ confirmed: false, paymentStatus: 'NotFound' }),
      queryTransaction,
    });

    await service.verifyDeposit('user-1', 'dep-1');

    expect(queryTransaction).toHaveBeenCalledWith('TX-1');
    expect(savingsService.applyExternalDeposit).toHaveBeenCalledWith(
      'user-1',
      5000,
      'Bank transfer credit',
      'FCSV-1',
      'general',
    );
    expect(pendingRepo.update).toHaveBeenCalledWith(
      'dep-1',
      expect.objectContaining({ status: 'credited' }),
    );
  });

  it('does not credit when the query call fails', async () => {
    const { service, savingsService } = build({
      confirmPayWithTransfer: jest
        .fn()
        .mockResolvedValue({ confirmed: false, paymentStatus: 'NotFound' }),
      queryTransaction: jest.fn().mockRejectedValue(new Error('boom')),
    });

    await service.verifyDeposit('user-1', 'dep-1');

    expect(savingsService.applyExternalDeposit).not.toHaveBeenCalled();
  });
});
