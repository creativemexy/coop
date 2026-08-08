import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface PaystackInitResponse {
  status: boolean;
  message: string;
  data?: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data?: {
    status: string;
    reference: string;
    amount: number;
    fees: number;
    paid_at: string;
    channel: string;
    customer: { email: string };
  };
}

export interface BankResolveResult {
  accountName: string;
  accountNumber: string;
  bankId?: number;
}

export interface PaystackTransferResult {
  reference: string;
  status: string;
  recipientCode: string;
}

export interface PaystackBalanceEntry {
  currency: string;
  available: number;
  balance: number;
}

@Injectable()
export class PaystackClient {
  private readonly logger = new Logger(PaystackClient.name);
  private readonly secretKey: string;
  private readonly baseUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.secretKey =
      configService.get<string>('PAYSTACK_SECRET_KEY') || '';
    this.baseUrl = 'https://api.paystack.co';
  }

  async initializeTransaction(params: {
    email: string;
    amount: number;
    reference: string;
    callbackUrl?: string;
    metadata?: Record<string, unknown>;
  }): Promise<{ authorizationUrl: string; accessCode: string }> {
    if (!this.secretKey || this.secretKey === 'sk_test_xxx') {
      this.logger.warn('Paystack secret key not configured, using stub');
      return {
        authorizationUrl: `https://checkout.paystack.com/${params.reference}`,
        accessCode: params.reference,
      };
    }

    try {
      const { data } = await firstValueFrom(
        this.httpService.post<PaystackInitResponse>(
          `${this.baseUrl}/transaction/initialize`,
          {
            email: params.email,
            amount: Math.round(params.amount * 100),
            reference: params.reference,
            callback_url: params.callbackUrl,
            metadata: params.metadata,
          },
          {
            headers: {
              Authorization: `Bearer ${this.secretKey}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      if (!data.status || !data.data) {
        throw new Error(`Paystack init failed: ${data.message}`);
      }

      return {
        authorizationUrl: data.data.authorization_url,
        accessCode: data.data.access_code,
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Paystack init failed: ${errorMessage}`);
      throw error;
    }
  }

  async verifyTransaction(
    reference: string,
  ): Promise<PaystackVerifyResponse['data']> {
    if (!this.secretKey || this.secretKey === 'sk_test_xxx') {
      this.logger.warn('Paystack secret key not configured, using stub');
      return {
        status: 'success',
        reference,
        amount: 0,
        fees: 0,
        paid_at: new Date().toISOString(),
        channel: 'card',
        customer: { email: '' },
      };
    }

    try {
      const { data } = await firstValueFrom(
        this.httpService.get<PaystackVerifyResponse>(
          `${this.baseUrl}/transaction/verify/${reference}`,
          {
            headers: { Authorization: `Bearer ${this.secretKey}` },
          },
        ),
      );

      if (!data.status) {
        throw new Error(`Paystack verify failed: ${data.message}`);
      }

      return data.data;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Paystack verify failed: ${errorMessage}`);
      throw error;
    }
  }

  async resolveBankAccount(
    accountNumber: string,
    bankCode: string,
  ): Promise<BankResolveResult | null> {
    if (!this.secretKey || this.secretKey === 'sk_test_xxx') {
      this.logger.warn('Paystack secret key not configured, skipping bank resolve');
      return null;
    }

    try {
      const { data } = await firstValueFrom(
        this.httpService.get<{
          status: boolean;
          message: string;
          data?: { account_name: string; account_number: string; bank_id?: number };
        }>(`${this.baseUrl}/bank/resolve`, {
          params: { account_number: accountNumber, bank_code: bankCode },
          headers: { Authorization: `Bearer ${this.secretKey}` },
        }),
      );

      if (!data.status || !data.data) {
        throw new Error(`Paystack bank resolve failed: ${data.message}`);
      }

      return {
        accountName: data.data.account_name,
        accountNumber: data.data.account_number,
        bankId: data.data.bank_id,
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Paystack bank resolve failed: ${errorMessage}`);
      throw error;
    }
  }

  async getBalance(): Promise<PaystackBalanceEntry[]> {
    if (!this.secretKey || this.secretKey === 'sk_test_xxx') {
      this.logger.warn('Paystack secret key not configured, using stub balance');
      return [{ currency: 'NGN', available: 0, balance: 0 }];
    }

    try {
      const { data } = await firstValueFrom(
        this.httpService.get<{
          status: boolean;
          message: string;
          data?: PaystackBalanceEntry[];
        }>(`${this.baseUrl}/balance`, {
          headers: { Authorization: `Bearer ${this.secretKey}` },
        }),
      );

      if (!data.status || !data.data) {
        throw new Error(`Paystack balance failed: ${data.message}`);
      }

      return data.data;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Paystack balance failed: ${errorMessage}`);
      throw error;
    }
  }

  async listBanks(): Promise<{ code: string; name: string; slug?: string }[]> {
    if (!this.secretKey || this.secretKey === 'sk_test_xxx') {
      this.logger.warn('Paystack secret key not configured, using stub bank list');
      return [
        { code: '999992', name: 'OPay' },
        { code: '058', name: 'GTBank' },
      ];
    }

    try {
      const { data } = await firstValueFrom(
        this.httpService.get<{
          status: boolean;
          message: string;
          data?: { code?: string; name?: string; slug?: string }[];
        }>(`${this.baseUrl}/bank`, {
          params: { currency: 'NGN', perPage: 300 },
          headers: { Authorization: `Bearer ${this.secretKey}` },
        }),
      );

      if (!data.status || !Array.isArray(data.data)) {
        throw new Error(`Paystack bank list failed: ${data.message}`);
      }

      return data.data
        .filter((b) => b.code && b.name)
        .map((b) => ({ code: b.code as string, name: b.name as string, slug: b.slug }));
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Paystack bank list failed: ${errorMessage}`);
      throw error;
    }
  }

  async createTransferRecipient(params: {
    name: string;
    accountNumber: string;
    bankCode: string;
  }): Promise<string> {
    if (!this.secretKey || this.secretKey === 'sk_test_xxx') {
      this.logger.warn('Paystack secret key not configured, using stub recipient');
      return `RCP_${params.accountNumber}`;
    }

    try {
      const { data } = await firstValueFrom(
        this.httpService.post<{
          status: boolean;
          message: string;
          data?: { recipient_code?: string };
        }>(
          `${this.baseUrl}/transferrecipient`,
          {
            type: 'nuban',
            name: params.name,
            account_number: params.accountNumber,
            bank_code: params.bankCode,
            currency: 'NGN',
          },
          {
            headers: {
              Authorization: `Bearer ${this.secretKey}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      if (!data.status || !data.data?.recipient_code) {
        throw new Error(`Paystack recipient create failed: ${data.message}`);
      }

      return data.data.recipient_code;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Paystack recipient create failed: ${errorMessage}`);
      throw error;
    }
  }

  async initiateTransfer(params: {
    amount: number;
    recipient: string;
    reason?: string;
    reference?: string;
  }): Promise<PaystackTransferResult> {
    const reference =
      params.reference ||
      `TFR-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    if (!this.secretKey || this.secretKey === 'sk_test_xxx') {
      this.logger.warn('Paystack secret key not configured, using stub transfer');
      return { reference, status: 'success', recipientCode: params.recipient };
    }

    try {
      const { data } = await firstValueFrom(
        this.httpService.post<{
          status: boolean;
          message: string;
          data?: { reference?: string; status?: string };
        }>(
          `${this.baseUrl}/transfer`,
          {
            source: 'balance',
            amount: Math.round(params.amount * 100),
            recipient: params.recipient,
            reason: params.reason,
            reference,
          },
          {
            headers: {
              Authorization: `Bearer ${this.secretKey}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      if (!data.status || !data.data?.reference) {
        throw new Error(`Paystack transfer failed: ${data.message}`);
      }

      return {
        reference: data.data.reference,
        status: data.data.status || 'success',
        recipientCode: params.recipient,
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Paystack transfer failed: ${errorMessage}`);
      throw error;
    }
  }

  async verifyTransfer(reference: string): Promise<PaystackTransferResult | null> {
    if (!this.secretKey || this.secretKey === 'sk_test_xxx') {
      this.logger.warn('Paystack secret key not configured, using stub verify');
      return { reference, status: 'success', recipientCode: '' };
    }

    try {
      const { data } = await firstValueFrom(
        this.httpService.get<{
          status: boolean;
          message: string;
          data?: {
            reference?: string;
            status?: string;
            recipient?: { recipient_code?: string };
          };
        }>(`${this.baseUrl}/transfer/verify/${reference}`, {
          headers: { Authorization: `Bearer ${this.secretKey}` },
        }),
      );

      if (!data.status || !data.data) {
        return null;
      }

      return {
        reference: data.data.reference || reference,
        status: data.data.status || 'success',
        recipientCode: data.data.recipient?.recipient_code || '',
      };
    } catch (error: unknown) {
      const responseStatus = (error as { response?: { status?: number } })?.response?.status;
      if (responseStatus === 404) {
        return null;
      }
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Paystack transfer verify failed: ${errorMessage}`);
      throw error;
    }
  }
}
