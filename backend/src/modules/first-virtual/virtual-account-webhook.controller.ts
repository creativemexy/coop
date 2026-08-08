import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { SkipCsrf } from '../../common/guards/csrf.guard';
import { WebhookAuthGuard } from '../../common/guards/webhook-auth.guard';
import { DepositNotificationData } from './firstcheckout.client';
import { VirtualAccountsService } from './virtual-accounts.service';

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
    @Body() payload: Record<string, unknown>,
    @Headers('x-fch-signature') signature?: string,
    @Headers('x-fch-x-signature') altSignature?: string,
  ) {
    const headerSignature = signature || altSignature;
    if (this.secretKey && headerSignature) {
      const hash = crypto
        .createHmac('sha512', this.secretKey)
        .update(JSON.stringify(payload))
        .digest('hex');
      if (
        hash !== headerSignature &&
        // Some gateways sign the raw stringified body with the x header
        hash.toLowerCase() !== headerSignature.toLowerCase()
      ) {
        return { status: 'invalid_signature' };
      }
    }

    return this.service.handleDepositNotification(
      payload as unknown as DepositNotificationData,
    );
  }
}
