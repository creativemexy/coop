import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface VirtualAccountDraft {
  accountNumber: string;
  accountName?: string;
  bankName?: string;
  token?: string;
}

export interface FirstCheckoutTxResult {
  accessCode: string;
}

export interface DepositNotificationData {
  amount: string | number;
  currency?: string;
  requestReference: string;
  payerBankCode?: string;
  payerAccountName?: string;
  recipientAccountNumber: string;
}

export interface FirstCheckoutAuthResponse {
  value?: {
    access_token?: string;
    expires_in?: number | string;
  };
  /** Some FirstChekout responses return the token unwrapped. */
  access_token?: string;
  expires_in?: number | string;
}

export interface ConfirmTransferResult {
  /** True only when FirstChekout confirms the transfer completed. */
  confirmed: boolean;
  paymentStatus?: string;
  amount?: number;
  message?: string;
}

/**
 * True when the gateway rejected an expired/invalid bearer token (HTTP 401).
 */
function isAuthRejection(err: unknown): boolean {
  const e = err as { response?: { status?: number }; status?: number };
  return (e?.response?.status ?? e?.status) === 401;
}

/**
 * FirstCheckout payment gateway client.
 *
 * Docs: https://www.firstchekoutdev.com/onlinedoc/api (sandbox gateway)
 * Real endpoints are documented at the FirstCheckout merchant developer portal.
 *
 * Sandbox base: https://www.firstchekoutdev.com
 * Production base: https://www.firstchekout.com
 *
 * The client follows the same "stub fallback" pattern as PaystackClient: when
 * the integration is disabled or keys are missing it returns deterministic fake
 * data so the rest of the app can be developed without live credentials.
 */
@Injectable()
export class FirstCheckoutClient {
  private readonly logger = new Logger(FirstCheckoutClient.name);

  private readonly enabled: boolean;
  private readonly production: boolean;
  private readonly apiUrl: string;
  private readonly publicKey: string;
  private readonly secretKey: string;
  private readonly merchantId: string;
  private readonly clientId: string;
  private readonly clientSecret: string;

  private accessToken: string | null = null;
  private accessTokenAt = 0;
  /** Milliseconds the current token is trusted for, learned from expires_in. */
  private accessTokenTtlMs = 0;

  /** Refresh this long before the provider's expiry to absorb clock skew/latency. */
  private static readonly TOKEN_SAFETY_MARGIN_MS = 60 * 1000;
  /** Sample token response says expires_in: 600 — assume that when absent. */
  private static readonly TOKEN_FALLBACK_TTL_MS = 10 * 60 * 1000;
  /** Docs say the token expires after 30 minutes — never trust it longer. */
  private static readonly TOKEN_MAX_TTL_MS = 30 * 60 * 1000;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.production =
      process.env.NODE_ENV === 'production' ||
      process.env.APP_ENV === 'production';
    this.enabled =
      configService.get<string>('FIRST_BANKOUT_ENABLED') === 'true';
    this.apiUrl = (
      configService.get<string>('FIRST_BANKOUT_API_URL') ||
      'https://www.firstchekoutdev.com'
    ).replace(/\/$/, '');
    this.publicKey =
      configService.get<string>('FIRST_BANKOUT_PUBLIC_KEY') || '';
    this.secretKey =
      configService.get<string>('FIRST_BANKOUT_SECRET_KEY') || '';
    this.merchantId =
      configService.get<string>('FIRST_BANKOUT_MERCHANT_ID') || '';
    this.clientId = configService.get<string>('FIRST_BANKOUT_CLIENT_ID') || '';
    this.clientSecret =
      configService.get<string>('FIRST_BANKOUT_CLIENT_SECRET') || '';

    if (
      this.production &&
      this.enabled &&
      (!this.publicKey ||
        !this.secretKey ||
        !this.merchantId ||
        !this.clientId ||
        !this.clientSecret)
    ) {
      throw new Error(
        'All FirstCheckout credentials must be configured when enabled in production',
      );
    }
    if (
      this.production &&
      this.enabled &&
      this.apiUrl.includes('firstchekoutdev.com')
    ) {
      throw new Error(
        'A production FirstCheckout API URL is required when enabled in production',
      );
    }
  }

  private get isStub(): boolean {
    return (
      !this.enabled ||
      !this.publicKey ||
      !this.secretKey ||
      !this.merchantId ||
      !this.clientId ||
      !this.clientSecret
    );
  }

  private shouldUseStub(): boolean {
    if (!this.isStub) return false;
    if (this.production) {
      throw new Error('FirstCheckout stub mode is disabled in production');
    }
    return true;
  }

  isStubbed(): boolean {
    return this.isStub;
  }

  /** Initiate a transfer-funded virtual account for a deposit. This is the
   * high-level "pay with transfer" entry-point used by savings deposits.
   * `accessCode` is the transaction reference used later to confirm payment.
   */
  async createDepositVirtualAccount(params: {
    reference: string;
    amount: number;
    email: string;
    name?: string;
    purpose?: string;
  }): Promise<VirtualAccountDraft & { accessCode: string }> {
    const tx = await this.initiateTransaction({
      reference: params.reference,
      amount: params.amount,
      email: params.email,
      name: params.name,
      purpose: params.purpose,
    });
    const draft = await this.initiatePayWithTransfer({
      transactionReference: tx.accessCode,
      typeId: 2,
    });
    return { ...draft, accessCode: tx.accessCode };
  }

  private isTokenFresh(): boolean {
    if (!this.accessToken) return false;
    const expiresAt = this.accessTokenAt + this.accessTokenTtlMs;
    return expiresAt - Date.now() > FirstCheckoutClient.TOKEN_SAFETY_MARGIN_MS;
  }

  /**
   * @param forceRefresh bypass the cache and request a brand-new token. Used
   * when the gateway has already rejected the cached token (HTTP 401).
   */
  private async getAccessToken(forceRefresh = false): Promise<string> {
    if (!forceRefresh && this.isTokenFresh()) {
      return this.accessToken as string;
    }

    const { data } = await firstValueFrom(
      this.httpService.post<FirstCheckoutAuthResponse>(
        `${this.apiUrl}/identityserver/api/v2/Authenticate/token`,
        new URLSearchParams({
          client_Id: this.clientId,
          client_Secret: this.clientSecret,
          grant_type: 'client_credentials',
        }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
      ),
    );

    const token = data?.value?.access_token ?? data?.access_token;
    if (!token) {
      throw new Error('FirstCheckout access token was empty');
    }

    // Cache only as long as the provider actually granted — never longer than
    // the documented 30-minute expiry, regardless of what it claims.
    const expiresInSec = Number(data?.value?.expires_in ?? data?.expires_in);
    const ttlMs =
      Number.isFinite(expiresInSec) && expiresInSec > 0
        ? Math.min(expiresInSec * 1000, FirstCheckoutClient.TOKEN_MAX_TTL_MS)
        : FirstCheckoutClient.TOKEN_FALLBACK_TTL_MS;

    this.accessToken = token;
    this.accessTokenAt = Date.now();
    this.accessTokenTtlMs = ttlMs;
    return token;
  }

  /**
   * Run an authenticated request, and if the gateway rejects the token with a
   * 401, force-refresh the token and retry exactly once. Without this a token
   * that slips past the cache window would break payment flows until the cache
   * naturally expired.
   */
  private async withAccessToken<T>(
    request: (token: string) => Promise<T>,
  ): Promise<T> {
    const token = await this.getAccessToken();
    try {
      return await request(token);
    } catch (err) {
      if (!isAuthRejection(err)) throw err;
      const refreshed = await this.getAccessToken(true);
      return request(refreshed);
    }
  }

  private stubAccount(seed: string): string {
    const digits = seed.replace(/\D/g, '').slice(0, 7).padStart(7, '0');
    return `910${digits}`;
  }

  async initiateTransaction(params: {
    reference: string;
    amount: number;
    email: string;
    name?: string;
    purpose?: string;
  }): Promise<FirstCheckoutTxResult> {
    if (this.shouldUseStub()) {
      this.logger.warn('FirstCheckout not configured, using stub transaction');
      return {
        accessCode: `TX-${params.reference.slice(0, 26).toUpperCase()}`,
      };
    }

    const { data } = await this.withAccessToken((token) =>
      firstValueFrom(
        this.httpService.post<{
          status: string;
          data?: { accessCode?: string };
        }>(
          `${this.apiUrl}/apigateway/api/v1/transactions/initiate`,
          {
            Amount: params.amount,
            PayerEmail: params.email,
            PayerName: params.name || '',
            Purpose: params.purpose || 'savings',
            PublicKey: this.publicKey,
            PaymentReference: params.reference,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      ),
    );

    const accessCode = data?.data?.accessCode;
    if (!accessCode) {
      throw new Error(`FirstCheckout transaction init failed: ${data?.status}`);
    }
    return { accessCode };
  }

  async initiatePayWithTransfer(params: {
    transactionReference: string;
    typeId?: number;
  }): Promise<VirtualAccountDraft> {
    if (this.shouldUseStub()) {
      this.logger.warn(
        'FirstCheckout not configured, using stub virtual account',
      );
      return {
        accountNumber: this.stubAccount(params.transactionReference),
        accountName: 'Coop Member',
        bankName: 'First Bank',
      };
    }

    const { data } = await this.withAccessToken((token) =>
      firstValueFrom(
        this.httpService.post<{
          status?: string;
          data?: {
            accountDetails?: {
              accountName?: string;
              virtualAccountNo?: string;
              virtualAccountName?: string;
            };
            token?: string;
            success?: boolean;
            message?: string;
          };
        }>(
          `${this.apiUrl}/apigateway/api/v1/paywithtransfer/initiate`,
          {
            TransactionReference: params.transactionReference,
            TypeId: params.typeId ?? 2,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      ),
    );

    const details = data?.data?.accountDetails;
    const accountNumber = details?.virtualAccountNo;
    if (!accountNumber) {
      throw new Error(
        `FirstCheckout pay-with-transfer failed: ${
          data?.data?.message ?? data?.status ?? 'unknown error'
        }`,
      );
    }

    // Sandbox VA names look like "FIRSTCHEKOUT-SANDBOX EMEKA IKE 9288" (no
    // bank prefix); live ones look like "BANK NAME/Account Holder". Only split
    // when a slash is present so we never expose the holder as the bank.
    const rawName = details?.virtualAccountName || '';
    const bankName = rawName.includes('/')
      ? (rawName.split('/')[0] || '').trim()
      : '';

    return {
      accountNumber,
      accountName: details.accountName,
      bankName: bankName || 'First Bank',
      token: data.data?.token,
    };
  }

  async queryTransaction(reference: string): Promise<{
    transactionReference?: string;
    status?: string;
    amount?: number;
  }> {
    if (this.shouldUseStub()) {
      this.logger.warn(
        'FirstCheckout not configured — queryTransaction blocked (gateway not live)',
      );
      return { transactionReference: reference, status: 'BLOCKED', amount: 0 };
    }

    const { data } = await this.withAccessToken((token) =>
      firstValueFrom(
        this.httpService.get<{
          status: string;
          data?: {
            transactionReference?: string;
            status?: string;
            amount?: number;
          };
        }>(
          `${this.apiUrl}/apigateway/api/v1/transactions/referenceId/${encodeURIComponent(
            reference,
          )}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Merchant-Id': this.merchantId,
              'Secret-Key': this.secretKey,
            },
          },
        ),
      ),
    );

    return data?.data ?? {};
  }

  async confirmPayWithTransfer(params: {
    reference: string;
    accountNumber: string;
    token?: string;
  }): Promise<ConfirmTransferResult> {
    if (this.shouldUseStub()) {
      this.logger.warn(
        'FirstCheckout not configured — confirm blocked (gateway not live)',
      );
      return {
        confirmed: false,
        paymentStatus: 'BLOCKED',
        amount: 0,
        message: 'Stub confirm-blocked (gateway not live)',
      };
    }

    const { data } = await this.withAccessToken((token) =>
      firstValueFrom(
        this.httpService.post<{
          status?: string;
          message?: string;
          data?:
            | string
            | {
                message?: string;
                transactions?: Array<{
                  paymentStatus?: string;
                  approvalStatus?: string;
                  amount?: number;
                  message?: string;
                }>;
              };
        }>(
          `${this.apiUrl}/apigateway/api/v1/paywithtransfer/confirm-payment`,
          {
            UniqueReference: params.reference,
            VirtualAccountNo: params.accountNumber,
            VirtualAccountToken: params.token,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      ),
    );

    // Docs success body: { data: { message: "Successful",
    // transactions: [{ approvalStatus: "APPROVED" }] }, status: "OK" }.
    // Error bodies: { status: "error", message: "..." } with no approval.
    const tx =
      typeof data?.data === 'object' ? data.data.transactions?.[0] : undefined;
    // Live "no transfer yet" body: { data: "No successful transaction record
    // for this account: …", status: "NotFound" } — keep the detail for logs.
    const message =
      typeof data?.data === 'string'
        ? data.data
        : (data?.data?.message ?? data?.message ?? data?.status);
    const messageLc = (
      typeof message === 'string' ? message : ''
    ).toLowerCase();
    const paymentStatus =
      tx?.paymentStatus ?? tx?.approvalStatus ?? data?.status;
    const outerOk = data?.status === 'OK';
    const approved =
      (tx?.paymentStatus ?? '').toUpperCase() === 'SUCCESSFUL' ||
      (tx?.approvalStatus ?? '').toUpperCase() === 'APPROVED' ||
      (outerOk && messageLc.includes('successful'));

    return {
      confirmed: approved,
      paymentStatus,
      amount: tx?.amount,
      message,
    };
  }
}
