import { KorapayClient } from './korapay.client';

describe('KorapayClient', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalAppEnv = process.env.APP_ENV;

  afterEach(() => {
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalNodeEnv;
    if (originalAppEnv === undefined) delete process.env.APP_ENV;
    else process.env.APP_ENV = originalAppEnv;
  });

  it('fails during production startup without a secret key', () => {
    process.env.NODE_ENV = 'test';
    process.env.APP_ENV = 'production';

    expect(
      () =>
        new KorapayClient(
          { get: jest.fn().mockReturnValue(undefined) } as any,
          {} as any,
        ),
    ).toThrow('KORAPAY_SECRET_KEY must be configured in production');
  });
});
