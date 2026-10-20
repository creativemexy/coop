import { PaystackClient } from './paystack.client';

describe('PaystackClient', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalAppEnv = process.env.APP_ENV;

  afterEach(() => {
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalNodeEnv;
    if (originalAppEnv === undefined) delete process.env.APP_ENV;
    else process.env.APP_ENV = originalAppEnv;
  });

  it('fails during production startup without a real secret key', () => {
    process.env.NODE_ENV = 'test';
    process.env.APP_ENV = 'production';

    expect(
      () =>
        new PaystackClient(
          { get: jest.fn().mockReturnValue(undefined) } as any,
          {} as any,
        ),
    ).toThrow('A live PAYSTACK_SECRET_KEY is required in production');
  });

  it('rejects test-mode keys in production', () => {
    process.env.NODE_ENV = 'test';
    process.env.APP_ENV = 'production';

    expect(
      () =>
        new PaystackClient(
          { get: jest.fn().mockReturnValue('sk_test_example') } as any,
          {} as any,
        ),
    ).toThrow('A live PAYSTACK_SECRET_KEY is required in production');
  });
});
