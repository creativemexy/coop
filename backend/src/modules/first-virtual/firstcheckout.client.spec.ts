import { of, throwError } from 'rxjs';
import type { ConfigService } from '@nestjs/config';
import type { HttpService } from '@nestjs/axios';
import { FirstCheckoutClient } from './firstcheckout.client';

const CONFIG: Record<string, string> = {
  FIRST_BANKOUT_ENABLED: 'true',
  FIRST_BANKOUT_PUBLIC_KEY: 'pub',
  FIRST_BANKOUT_SECRET_KEY: 'sec',
  FIRST_BANKOUT_MERCHANT_ID: 'mer',
  FIRST_BANKOUT_CLIENT_ID: 'cli',
  FIRST_BANKOUT_CLIENT_SECRET: 'csec',
};

type HttpMock = {
  post: jest.Mock;
  get: jest.Mock;
};

type PostCall = [
  string,
  unknown,
  { headers: Record<string, string> } | undefined,
];

function buildClient(http: HttpMock): FirstCheckoutClient {
  process.env.NODE_ENV = 'test';
  delete process.env.APP_ENV;
  const config = {
    get: jest.fn((key: string) => CONFIG[key]),
  } as unknown as ConfigService;
  return new FirstCheckoutClient(config, http as unknown as HttpService);
}

const isTokenCall = (url: string) => url.includes('/Authenticate/token');

const tokenResponse = (accessToken: string, expiresIn?: number) =>
  of({
    data: {
      value: {
        access_token: accessToken,
        ...(expiresIn !== undefined ? { expires_in: expiresIn } : {}),
      },
    },
  });

const txResponse = (accessCode: string) =>
  of({ data: { status: 'SUCCESS', data: { accessCode } } });

const authError = () => throwError(() => ({ response: { status: 401 } }));

describe('FirstCheckoutClient', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalAppEnv = process.env.APP_ENV;

  afterEach(() => {
    jest.restoreAllMocks();
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalNodeEnv;
    if (originalAppEnv === undefined) delete process.env.APP_ENV;
    else process.env.APP_ENV = originalAppEnv;
  });

  it('fails at startup when enabled production credentials are incomplete', () => {
    process.env.NODE_ENV = 'test';
    process.env.APP_ENV = 'production';

    expect(
      () =>
        new FirstCheckoutClient(
          {
            get: jest.fn((key: string) =>
              key === 'FIRST_BANKOUT_ENABLED' ? 'true' : undefined,
            ),
          } as any,
          {} as any,
        ),
    ).toThrow(
      'All FirstCheckout credentials must be configured when enabled in production',
    );
  });

  it('does not return stub transactions in production when disabled', async () => {
    process.env.NODE_ENV = 'test';
    process.env.APP_ENV = 'production';
    const client = new FirstCheckoutClient(
      { get: jest.fn().mockReturnValue(undefined) } as any,
      {} as any,
    );

    await expect(
      client.initiateTransaction({
        reference: 'ref-1',
        amount: 100,
        email: 'member@example.com',
      }),
    ).rejects.toThrow('FirstCheckout stub mode is disabled in production');
  });

  it('rejects the default sandbox API URL when enabled in production', () => {
    process.env.NODE_ENV = 'test';
    process.env.APP_ENV = 'production';
    const config = {
      get: jest.fn((key: string) => {
        if (key === 'FIRST_BANKOUT_ENABLED') return 'true';
        if (key === 'FIRST_BANKOUT_PUBLIC_KEY') return 'public';
        if (key === 'FIRST_BANKOUT_SECRET_KEY') return 'secret';
        if (key === 'FIRST_BANKOUT_MERCHANT_ID') return 'merchant';
        if (key === 'FIRST_BANKOUT_CLIENT_ID') return 'client';
        if (key === 'FIRST_BANKOUT_CLIENT_SECRET') return 'client-secret';
        return undefined;
      }),
    };

    expect(() => new FirstCheckoutClient(config as any, {} as any)).toThrow(
      'A production FirstCheckout API URL is required when enabled in production',
    );
  });

  describe('access-token cache', () => {
    it('caches for the returned expires_in (not a fixed 55 minutes)', async () => {
      let now = 1_700_000_000_000;
      jest.spyOn(Date, 'now').mockImplementation(() => now);
      let tokenCalls = 0;
      const http: HttpMock = {
        get: jest.fn(),
        post: jest.fn((url: string) => {
          if (isTokenCall(url)) {
            tokenCalls += 1;
            return tokenResponse(`tok-${tokenCalls}`, 600);
          }
          return txResponse('AC-1');
        }),
      };
      const client = buildClient(http);

      await client.initiateTransaction({
        reference: 'r1',
        amount: 100,
        email: 'a@b.c',
      });
      expect(tokenCalls).toBe(1);

      now += 5 * 60 * 1000;
      await client.initiateTransaction({
        reference: 'r2',
        amount: 100,
        email: 'a@b.c',
      });
      expect(tokenCalls).toBe(1);

      now += 4 * 60 * 1000;
      await client.initiateTransaction({
        reference: 'r3',
        amount: 100,
        email: 'a@b.c',
      });
      expect(tokenCalls).toBe(2);
    });

    it('never trusts a token past the documented 30-minute expiry', async () => {
      let now = 1_700_000_000_000;
      jest.spyOn(Date, 'now').mockImplementation(() => now);
      let tokenCalls = 0;
      const http: HttpMock = {
        get: jest.fn(),
        post: jest.fn((url: string) => {
          if (isTokenCall(url)) {
            tokenCalls += 1;
            return tokenResponse(`tok-${tokenCalls}`, 7200);
          }
          return txResponse('AC-1');
        }),
      };
      const client = buildClient(http);

      await client.initiateTransaction({
        reference: 'r1',
        amount: 100,
        email: 'a@b.c',
      });
      expect(tokenCalls).toBe(1);

      now += 31 * 60 * 1000;
      await client.initiateTransaction({
        reference: 'r2',
        amount: 100,
        email: 'a@b.c',
      });
      expect(tokenCalls).toBe(2);
    });

    it('falls back to a short TTL when expires_in is missing', async () => {
      let now = 1_700_000_000_000;
      jest.spyOn(Date, 'now').mockImplementation(() => now);
      let tokenCalls = 0;
      const http: HttpMock = {
        get: jest.fn(),
        post: jest.fn((url: string) => {
          if (isTokenCall(url)) {
            tokenCalls += 1;
            return tokenResponse(`tok-${tokenCalls}`);
          }
          return txResponse('AC-1');
        }),
      };
      const client = buildClient(http);

      await client.initiateTransaction({
        reference: 'r1',
        amount: 100,
        email: 'a@b.c',
      });
      now += 11 * 60 * 1000;
      await client.initiateTransaction({
        reference: 'r2',
        amount: 100,
        email: 'a@b.c',
      });
      expect(tokenCalls).toBe(2);
    });

    it('refreshes once and retries when the gateway rejects the token', async () => {
      let tokenCalls = 0;
      let txAttempts = 0;
      const http: HttpMock = {
        get: jest.fn(),
        post: jest.fn((url: string) => {
          if (isTokenCall(url)) {
            tokenCalls += 1;
            return tokenResponse(`tok-${tokenCalls}`, 600);
          }
          txAttempts += 1;
          return txAttempts === 1 ? authError() : txResponse('AC-OK');
        }),
      };
      const client = buildClient(http);

      const result = await client.initiateTransaction({
        reference: 'r1',
        amount: 100,
        email: 'a@b.c',
      });

      expect(result.accessCode).toBe('AC-OK');
      expect(tokenCalls).toBe(2);
      const calls = http.post.mock.calls as PostCall[];
      const txCalls = calls.filter((call) => !isTokenCall(call[0]));
      expect(txCalls[1][2]?.headers.Authorization).toBe('Bearer tok-2');
    });

    it('does not retry more than once on repeated 401s', async () => {
      let tokenCalls = 0;
      let txAttempts = 0;
      const http: HttpMock = {
        get: jest.fn(),
        post: jest.fn((url: string) => {
          if (isTokenCall(url)) {
            tokenCalls += 1;
            return tokenResponse(`tok-${tokenCalls}`, 600);
          }
          txAttempts += 1;
          return authError();
        }),
      };
      const client = buildClient(http);

      await expect(
        client.initiateTransaction({
          reference: 'r1',
          amount: 100,
          email: 'a@b.c',
        }),
      ).rejects.toBeDefined();

      expect(txAttempts).toBe(2);
      expect(tokenCalls).toBe(2);
    });
  });

  describe('gateway request contract (verified against live sandbox)', () => {
    function routedHttp(handlers: {
      onToken: () => unknown;
      onInitiateTx?: () => unknown;
      onPayInitiate?: () => unknown;
      onConfirm?: () => unknown;
      onQuery?: () => unknown;
    }): HttpMock {
      return {
        get: jest.fn((url: string) =>
          url.includes('/transactions/referenceId/')
            ? (handlers.onQuery?.() ?? of({ data: { data: {}, status: 'OK' } }))
            : of({ data: {} }),
        ),
        post: jest.fn((url: string) => {
          if (isTokenCall(url)) return handlers.onToken();
          if (url.includes('/transactions/initiate')) {
            return handlers.onInitiateTx?.() ?? txResponse('AC-1');
          }
          if (url.includes('/paywithtransfer/initiate')) {
            return (
              handlers.onPayInitiate?.() ??
              of({
                data: {
                  data: {
                    accountDetails: {
                      accountName: 'Coop Member',
                      virtualAccountNo: '9101725955',
                      virtualAccountName: 'CORONATION REGISTRARS LIMITED/Coop',
                    },
                    token: 'va-token',
                  },
                  status: 'OK',
                },
              })
            );
          }
          if (url.includes('/paywithtransfer/confirm-payment')) {
            return handlers.onConfirm?.() ?? of({ data: {} });
          }
          return of({ data: {} });
        }),
      };
    }

    const headersOf = (http: HttpMock, match: string) => {
      const calls = http.post.mock.calls as PostCall[];
      const call = [...calls].reverse().find((c) => c[0].includes(match));
      return call?.[2]?.headers;
    };

    it('initiates the transaction with Authorization: Bearer', async () => {
      const http = routedHttp({ onToken: () => tokenResponse('tok-1', 600) });
      const client = buildClient(http);

      await client.initiateTransaction({
        reference: 'r1',
        amount: 100,
        email: 'a@b.c',
      });

      const headers = headersOf(http, '/transactions/initiate');
      expect(headers?.Authorization).toBe('Bearer tok-1');
    });

    it('creates the virtual account with Authorization: Bearer (sandbox 401s on Access-Token)', async () => {
      const http = routedHttp({ onToken: () => tokenResponse('tok-1', 600) });
      const client = buildClient(http);

      await client.initiatePayWithTransfer({ transactionReference: 'TX-1' });

      const headers = headersOf(http, '/paywithtransfer/initiate');
      expect(headers?.Authorization).toBe('Bearer tok-1');
      expect(headers?.['Access-Token']).toBeUndefined();
    });

    it('confirms payment with Authorization: Bearer', async () => {
      const http = routedHttp({
        onToken: () => tokenResponse('tok-1', 600),
        onConfirm: () =>
          of({
            data: {
              data: {
                message: 'Successful',
                transactions: [{ approvalStatus: 'APPROVED' }],
              },
              status: 'OK',
            },
          }),
      });
      const client = buildClient(http);

      await client.confirmPayWithTransfer({
        reference: 'TX-1',
        accountNumber: '9101725955',
        token: 'va-token',
      });

      const headers = headersOf(http, '/paywithtransfer/confirm-payment');
      expect(headers?.Authorization).toBe('Bearer tok-1');
      expect(headers?.['Access-Token']).toBeUndefined();
    });

    it('parses the live VA response and splits the bank from the holder name', async () => {
      const http = routedHttp({ onToken: () => tokenResponse('tok-1', 600) });
      const client = buildClient(http);

      const draft = await client.initiatePayWithTransfer({
        transactionReference: 'TX-1',
      });
      expect(draft.accountNumber).toBe('9101725955');
      expect(draft.bankName).toBe('CORONATION REGISTRARS LIMITED');
      expect(draft.token).toBe('va-token');
    });

    it('does not expose the holder as the bank when the VA has no bank prefix', async () => {
      const http: HttpMock = {
        get: jest.fn(),
        post: jest.fn((url: string) =>
          isTokenCall(url)
            ? tokenResponse('tok-1', 600)
            : of({
                data: {
                  data: {
                    accountDetails: {
                      accountName: 'FIRSTCHEKOUT-SANDBOX EMEKA IKE 9288',
                      virtualAccountNo: '9600002445',
                      virtualAccountName: 'FIRSTCHEKOUT-SANDBOX EMEKA IKE 9288',
                    },
                    token: 'va-token',
                  },
                  status: 'OK',
                },
              }),
        ),
      };
      const client = buildClient(http);

      const draft = await client.initiatePayWithTransfer({
        transactionReference: 'TX-1',
      });
      expect(draft.bankName).toBe('First Bank');
    });

    it('treats approvalStatus APPROVED as a confirmed transfer', async () => {
      const http = routedHttp({
        onToken: () => tokenResponse('tok-1', 600),
        onConfirm: () =>
          of({
            data: {
              data: {
                message: 'Successful',
                transactions: [{ approvalStatus: 'APPROVED' }],
              },
              status: 'OK',
            },
          }),
      });
      const client = buildClient(http);

      const res = await client.confirmPayWithTransfer({
        reference: 'TX-1',
        accountNumber: '9101725955',
      });
      expect(res.confirmed).toBe(true);
      expect(res.message).toBe('Successful');
    });

    it('does not confirm on the live "NotFound" error body', async () => {
      const http = routedHttp({
        onToken: () => tokenResponse('tok-1', 600),
        onConfirm: () =>
          of({
            data: {
              data: 'No successful transaction record for this account: 9600002445',
              status: 'NotFound',
            },
          }),
      });
      const client = buildClient(http);

      const res = await client.confirmPayWithTransfer({
        reference: 'TX-1',
        accountNumber: '9600002445',
      });
      expect(res.confirmed).toBe(false);
      expect(res.paymentStatus).toBe('NotFound');
      expect(res.message).toBe(
        'No successful transaction record for this account: 9600002445',
      );
    });

    it('does not confirm when the gateway reports an error', async () => {
      const http = routedHttp({
        onToken: () => tokenResponse('tok-1', 600),
        onConfirm: () =>
          of({
            data: {
              status: 'error',
              message: 'Invalid or expired virtual account token.',
            },
          }),
      });
      const client = buildClient(http);

      const res = await client.confirmPayWithTransfer({
        reference: 'TX-1',
        accountNumber: '9101725955',
      });
      expect(res.confirmed).toBe(false);
    });

    it('queries a transaction with Bearer + Merchant-Id + Secret-Key', async () => {
      const http = routedHttp({
        onToken: () => tokenResponse('tok-1', 600),
        onQuery: () =>
          of({
            data: {
              data: { status: 'SUCCESS', amount: 5000 },
              status: 'OK',
            },
          }),
      });
      const client = buildClient(http);

      const res = await client.queryTransaction('TX-1');

      const getCall = http.get.mock.calls[0] as [
        string,
        { headers: Record<string, string> },
      ];
      expect(getCall[1].headers.Authorization).toBe('Bearer tok-1');
      expect(getCall[1].headers['Merchant-Id']).toBe('mer');
      expect(getCall[1].headers['Secret-Key']).toBe('sec');
      expect(res.status).toBe('SUCCESS');
      expect(res.amount).toBe(5000);
    });

    it('reads the token from a top-level access_token response too', async () => {
      const http: HttpMock = {
        get: jest.fn(),
        post: jest.fn((url: string) =>
          isTokenCall(url)
            ? of({
                data: {
                  access_token: 'flat-token',
                  token_type: 'Bearer',
                  expires_in: 600,
                },
              })
            : txResponse('AC-1'),
        ),
      };
      const client = buildClient(http);

      const res = await client.initiateTransaction({
        reference: 'r1',
        amount: 100,
        email: 'a@b.c',
      });
      expect(res.accessCode).toBe('AC-1');
      const headers = headersOf(http, '/transactions/initiate');
      expect(headers?.Authorization).toBe('Bearer flat-token');
    });
  });
});
