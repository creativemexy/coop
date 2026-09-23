import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  Req,
  UseGuards,
  ServiceUnavailableException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { SkipCsrf } from '../../common/guards/csrf.guard';
import { WebhookAuthGuard } from '../../common/guards/webhook-auth.guard';
import { DepositNotificationData } from './firstcheckout.client';
import { VirtualAccountsService } from './virtual-accounts.service';
import type { Request } from 'express';

function safeEqualHex(expected: string, provided: string): boolean {
  const a = Buffer.from(expected.toLowerCase(), 'hex');
  const b = Buffer.from(provided.toLowerCase(), 'hex');
  if (a.length === 0 || a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/**
 * FirstCheckout / Interswitch (FBN whitelabel) virtual-account deposit callback.
 *
 * When a customer credits the virtual account the callback body is:
 * {
 *   amount: 139000,            // amount credited
 *   currency: "NGN",
 *   requestReference: "QTBS-...",
 *   payerBankCode: "000016",
 *   payerAccountName: "Anastasia Turner",
 *   recipientAccountNumber: "0844250325"   // the member's virtual account
 * }
 */
@Controller('api/v1/payments/webhook')
@SkipCsrf()
@UseGuards(WebhookAuthGuard)
export class VirtualAccountWebhookController {
  private readonly secretKey: string;

  constructor(
    private readonly service: VirtualAccountsService,
    private readonly configService: ConfigService,
  ) {
    this.secretKey =
      configService.get<string>('FIRST_BANKOUT_SECRET_KEY') || '';
  }

  @Post('firstcheckout/virtual-account-deposit')
  @HttpCode(HttpStatus.OK)
  async handleDeposit(
    @Req() req: Request,
    @Body() payload: Record<string, unknown>,
    @Headers('x-fch-signature') signature?: string,
    @Headers('x-fch-x-signature') altSignature?: string,
  ) {
    const headerSignature = signature || altSignature;
    if (!this.secretKey) {
      // Fail closed: never process a deposit callback without the gateway key.
      throw new ServiceUnavailableException(
        'Payment webhook misconfigured (gateway secret not set)',
      );
    }

    if (!headerSignature) {
      return { status: 'invalid_signature' };
    }

    const rawBody =
      (req as unknown as { rawBody?: string }).rawBody ??
      JSON.stringify(payload);
    const expected = crypto
      .createHmac('sha512', this.secretKey)
      .update(rawBody)
      .digest('hex');

    if (!safeEqualHex(expected, headerSignature)) {
      return { status: 'invalid_signature' };
    }

    return this.service.handleDepositNotification(
      payload as unknown as DepositNotificationData,
    );
  }
}
