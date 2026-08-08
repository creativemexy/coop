import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';
import {
  KorapayIdentityType,
  KorapayLookupRequest,
  KorapayLookupResponse,
  KorapayLookupData,
  KorapayWebhookPayload,
  KORAPAY_ENDPOINTS,
} from './korapay.types';

@Injectable()
export class KorapayClient {
  private readonly logger = new Logger(KorapayClient.name);
  private readonly baseUrl: string;
  private readonly secretKey: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.secretKey = configService.get<string>('KORAPAY_SECRET_KEY') || '';
    this.baseUrl = 'https://api.korapay.com/merchant';
  }

  async verifyIdentity(params: {
    id: string;
    type: KorapayIdentityType;
    reference: string;
  }): Promise<KorapayLookupData> {
    const identityType: KorapayIdentityType = params.type || 'bvn';

    if (!this.secretKey) {
      this.logger.warn('KORAPAY_SECRET_KEY not configured, using stub');
      return {
        reference: params.reference,
        id: params.id,
        id_type: `ng_${identityType}`,
        first_name: 'John',
        last_name: 'Doe',
        date_of_birth: '1990-01-01',
        phone_number: '08000000000',
        status: 'verified',
      } as any;
    }

    const endpoint = KORAPAY_ENDPOINTS[identityType];
    if (!endpoint) {
      throw new Error(`Unknown identity type: ${identityType}`);
    }

    try {
      const body: KorapayLookupRequest = {
        id: params.id,
        verification_consent: true,
      };

      const response = await firstValueFrom(
        this.httpService.post<KorapayLookupResponse>(
          `${this.baseUrl}${endpoint}`,
          body,
          {
            headers: {
              Authorization: `Bearer ${this.secretKey}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      const data = response.data;

      if (!data.status) {
        this.logger.warn(`Korapay lookup failed: ${JSON.stringify(data)}`);
        throw new Error(data.message || 'Korapay identity verification failed');
      }

      return data.data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Korapay identity verification failed: ${errorMessage}`);
      throw error;
    }
  }

  verifyWebhookSignature(rawBody: string, signature: string): boolean {
    if (!this.secretKey) return true;
    if (!signature) return false;
    const expected = crypto
      .createHmac('sha256', this.secretKey)
      .update(rawBody)
      .digest('hex');
    try {
      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    } catch {
      return signature === expected;
    }
  }

  parseWebhookPayload(payload: any): KorapayWebhookPayload | null {
    if (!payload?.event || !payload?.data?.reference) return null;
    return payload as KorapayWebhookPayload;
  }
}
