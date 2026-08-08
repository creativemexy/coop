import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { WebhookAuthGuard } from '../../../common/guards/webhook-auth.guard';
import { PaymentsService } from '../payments.service';
import { WebhookLog } from '../entities/webhook-log.entity';
import {
  PaymentStatus,
  PayoutStatus,
} from '../../../common/enums/status.enum';
import { User } from '../../users/entities/user.entity';
import { DoubleEntryService } from '../../ledger/services/double-entry.service';
import { FeeShareService } from '../../ledger/services/fee-share.service';
import { AccountsService } from '../../ledger/services/accounts.service';

@Controller('api/v1/payments/webhook')
@UseGuards(WebhookAuthGuard)
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);
  private readonly secretKey: string;

  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly configService: ConfigService,
    private readonly doubleEntryService: DoubleEntryService,
    private readonly feeShareService: FeeShareService,
    private readonly accountsService: AccountsService,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(WebhookLog)
    private readonly webhookLogRepo: Repository<WebhookLog>,
  ) {
    this.secretKey =
      configService.get<string>('PAYSTACK_SECRET_KEY') || '';
  }

  @Post('paystack')
  @HttpCode(HttpStatus.OK)
  async handlePaystackWebhook(
    @Body() payload: Record<string, unknown>,
    @Headers('x-paystack-signature') signature: string,
  ) {
    if (this.secretKey) {
      const hash = crypto
        .createHmac('sha512', this.secretKey)
        .update(JSON.stringify(payload))
        .digest('hex');

      if (hash !== signature) {
        throw new UnauthorizedException('Invalid webhook signature');
      }
    }

    const event = payload?.event as string | undefined;
    const data = payload?.data as Record<string, unknown> | undefined;
    const providerReference = data?.reference as string | undefined;
    const eventId = (data?.id || payload?.id) as string | undefined;

    if (!providerReference) {
      return { status: 'ignored' };
    }

    const existingPayment =
      await this.paymentsService.findByProviderReference(providerReference);

    // Idempotency: skip if already processed successfully or failed
    if (existingPayment && existingPayment.status !== PaymentStatus.PENDING) {
      return { status: 'already_processed' };
    }

    // Idempotency: deduplicate by event id (Paystack unique event identifier)
    if (existingPayment?.metadata) {
      const meta = existingPayment.metadata as Record<string, unknown>;
      if (meta.processedEventIds && Array.isArray(meta.processedEventIds) && eventId) {
        if ((meta.processedEventIds as string[]).includes(eventId)) {
          return { status: 'duplicate_event' };
        }
      }
    }

    switch (event) {
      case 'charge.success':
        await this.paymentsService.updateStatus(
          existingPayment?.id || '',
          PaymentStatus.SUCCESS,
          data,
        );
        await this.paymentsService.updatePayoutStatus(
          existingPayment?.id || '',
          PayoutStatus.PENDING,
          `POOL_${providerReference}`,
        );
        // Record event id in metadata for deduplication
        if (eventId && existingPayment?.id) {
          try {
            const existingMeta = (existingPayment.metadata as Record<string, unknown>) || {};
            const processedIds = (existingMeta.processedEventIds as string[]) || [];
            processedIds.push(eventId);
            await this.paymentsService.updateStatus(existingPayment.id, PaymentStatus.SUCCESS, {
              ...existingMeta,
              processedEventIds: processedIds,
            });
          } catch { /* non-critical */ }
        }
        const paymentMeta = existingPayment?.metadata as Record<string, unknown> | null;
        if (paymentMeta?.purpose === 'registration' && existingPayment?.userId) {
          await this.userRepo.update(existingPayment.userId, { registrationFeePaid: true, isActive: true });
          const user = await this.userRepo.findOne({ where: { id: existingPayment.userId } });
          if (user) {
            const cashAccount = await this.accountsService.findByCode('1000');
            const revenueAccount = await this.accountsService.findByCode('4200') ?? await this.accountsService.findByCode('4100');
            if (cashAccount && revenueAccount) {
              try {
                await this.doubleEntryService.postEntry({
                  description: `Registration fee - ${user.email}`,
                  entryDate: new Date(),
                  postedBy: 'SYSTEM',
                  lines: [
                    { accountId: cashAccount.id, debit: existingPayment.amount, credit: 0, organizationId: user.organizationId ?? undefined },
                    { accountId: revenueAccount.id, debit: 0, credit: existingPayment.amount, organizationId: user.organizationId ?? undefined },
                  ],
                });
              } catch (jeErr) {
                this.logger.warn(`Journal entry creation failed: ${(jeErr as Error).message}`);
              }
            }
            try {
              await this.feeShareService.recordRegistrationFee({
                paymentId: existingPayment.id,
                totalFee: existingPayment.amount,
                organizationId: user.organizationId ?? undefined,
                apexOrgId: user.apexOrgId ?? undefined,
              });
            } catch (fsErr) {
              this.logger.warn(`Fee share recording failed: ${(fsErr as Error).message}`);
            }
          }
          this.logger.log(`Registration fee paid for user: ${existingPayment.userId}`);
        }
        this.logger.log(`Payment succeeded: ${providerReference}`);
        break;

      case 'charge.failed':
        await this.paymentsService.updateStatus(
          existingPayment?.id || '',
          PaymentStatus.FAILED,
          data,
        );
        this.logger.log(`Payment failed: ${providerReference}`);
        break;
    }

    // Log webhook event
    try {
      await this.webhookLogRepo.save({
        provider: 'paystack',
        eventType: event || 'unknown',
        eventId: eventId || `${providerReference}_${Date.now()}`,
        paymentId: existingPayment?.id || undefined,
        status: event === 'charge.success' ? 'processed' : 'failed',
        payload: payload as any,
        retryCount: 0,
      } as WebhookLog);
    } catch { /* non-critical */ }

    return { status: 'processed' };
  }
}
