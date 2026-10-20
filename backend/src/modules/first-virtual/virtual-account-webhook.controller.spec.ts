import * as crypto from 'crypto';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { VirtualAccountWebhookController } from './virtual-account-webhook.controller';

describe('VirtualAccountWebhookController', () => {
  const secret = 'firstchekout-test-secret';
  const payload = {
    amount: 100,
    requestReference: 'FC-TEST-1',
    recipientAccountNumber: '9101234567',
  };
  const rawBody = JSON.stringify(payload);
  const signature = crypto
    .createHmac('sha512', secret)
    .update(rawBody)
    .digest('hex');
  const service = {
    handleDepositNotification: jest.fn().mockResolvedValue({
      status: 'processed',
    }),
  };
  const controller = new VirtualAccountWebhookController(
    service as any,
    { get: jest.fn().mockReturnValue(secret) } as any,
  );
  const request = { rawBody } as any;

  beforeEach(() => service.handleDepositNotification.mockClear());

  it('accepts a valid FirstChekout HMAC signature', async () => {
    await expect(
      controller.handleDeposit(request, payload, signature),
    ).resolves.toEqual({ status: 'processed' });
    expect(service.handleDepositNotification).toHaveBeenCalledWith(payload);
  });

  it('rejects malformed signatures without processing the callback', async () => {
    await expect(
      controller.handleDeposit(request, payload, `${signature}zz`),
    ).resolves.toEqual({ status: 'invalid_signature' });
    expect(service.handleDepositNotification).not.toHaveBeenCalled();
  });

  it('does not require the shared webhook-secret guard', () => {
    expect(
      Reflect.getMetadata(GUARDS_METADATA, VirtualAccountWebhookController),
    ).toBeUndefined();
  });
});