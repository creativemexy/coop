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
  private readonly apiUrl: string;
  private readonly publicKey: string;
  private readonly secretKey: string;
  private readonly merchantId: string;
  private readonly clientId: string;
  private readonly clientSecret: string;

  private accessToken: string | null = null;
  private accessTokenAt = 0;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
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
  }

  private get isStub(): boolean {
    return !this.enabled || !this.publicKey || !this.clientId;
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

  private async getAccessToken(): Promise<string> {
    const ttl = 55 * 60 * 1000;
    if (this.accessToken && Date.now() - this.accessTokenAt < ttl) {
      return this.accessToken;
    }

    const { data } = await firstValueFrom(
      this.httpService.post<{ value: { access_token: string } }>(
        `${this.apiUrl}/identityserver/api/v2/Authenticate/token`,
        new URLSearchParams({
          client_Id: this.clientId,
          client_Secret: this.clientSecret,
          grant_type: 'client_credentials',
        }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
      ),
    );

    const token = data?.value?.access_token;
    if (!token) {
      throw new Error('FirstCheckout access token was empty');
    }
    this.accessToken = token;
    this.accessTokenAt = Date.now();
    return token;
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
    if (this.isStub) {
      this.logger.warn('FirstCheckout not configured, using stub transaction');
      return {
        accessCode: `TX-${params.reference.slice(0, 26).toUpperCase()}`,
      };
    }

    const token = await this.getAccessToken();
    const { data } = await firstValueFrom(
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
    if (this.isStub) {
      this.logger.warn(
        'FirstCheckout not configured, using stub virtual account',
      );
      return {
        accountNumber: this.stubAccount(params.transactionReference),
        accountName: 'Coop Member',
        bankName: 'First Bank',
      };
    }

    const token = await this.getAccessToken();
    const { data } = await firstValueFrom(
      this.httpService.post<{
        status: string;
        data?: {
          accountDetails?: {
            accountName?: string;
            virtualAccountNo?: string;
            virtualAccountName?: string;
          };
          token?: string;
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
    );

    const details = data?.data?.accountDetails;
    const accountNumber = details?.virtualAccountNo;
    if (!accountNumber) {
      throw new Error(
        `FirstCheckout pay-with-transfer failed: ${data?.status}`,
      );
    }

    const bankName = (details?.virtualAccountName || '').split('/')[0].trim();

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
    if (this.isStub) {
      this.logger.warn(
        'FirstCheckout not configured — queryTransaction blocked (gateway not live)',
      );
      return { transactionReference: reference, status: 'BLOCKED', amount: 0 };
    }

    const { data } = await firstValueFrom(
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
            'Merchant-Id': this.merchantId,
            'Secret-Key': this.secretKey,
          },
        },
      ),
    );

    return data?.data ?? {};
  }

  async confirmPayWithTransfer(params: {
    reference: string;
    accountNumber: string;
    token?: string;
  }): Promise<{ paymentStatus?: string; amount?: number; message?: string }> {
    if (this.isStub) {
      this.logger.warn(
        'FirstCheckout not configured — confirm blocked (gateway not live)',
      );
      return {
        paymentStatus: 'BLOCKED',
        amount: 0,
        message: 'Stub confirm-blocked (gateway not live)',
      };
    }

    const token = await this.getAccessToken();
    const { data } = await firstValueFrom(
      this.httpService.post<{
        status: string;
        data?: {
          transactions?: Array<{
            paymentStatus?: string;
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
    );

    const tx = data?.data?.transactions?.[0];
    return {
      paymentStatus: tx?.paymentStatus,
      amount: tx?.amount,
      message: tx?.message || data?.status,
    };
  }
}
