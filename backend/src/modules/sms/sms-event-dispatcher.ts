import { Injectable, Logger } from '@nestjs/common';
import { SmsService } from './sms.service';

@Injectable()
export class SmsEventDispatcher {
  private readonly logger = new Logger(SmsEventDispatcher.name);

  constructor(private readonly smsService: SmsService) {}

  async emit(
    event: string,
    data: { userId: string; [key: string]: unknown },
  ): Promise<void> {
    this.logger.log(`SMS Event: ${event} for user ${data.userId}`);

    // Map events to SMS messages
    const smsConfig: Record<
      string,
      {
        message: (d: Record<string, unknown>) => string;
        recipient: (d: Record<string, unknown>) => string;
      }
    > = {
      'payment.success': {
        message: (d) =>
          `Payment of ₦${d.amount as number} was successful. Ref: ${d.reference as string}`,

        recipient: (d) => (d.phone as string) || '',
      },
      'registration.complete': {
        message: () =>
          'Welcome to the Cooperative! Your account has been created.',

        recipient: (d) => (d.phone as string) || '',
      },
      'kyc.approved': {
        message: () =>
          'Your KYC has been approved. You can now access all features.',

        recipient: (d) => (d.phone as string) || '',
      },
      'installment.reminder': {
        message: (d) =>
          `Reminder: Your BNPL installment of ₦${d.amount as number} is due on ${d.dueDate as string}.`,

        recipient: (d) => (d.phone as string) || '',
      },
    };

    const config = smsConfig[event];

    if (config && data.phone) {
      await this.smsService.send(
        data.phone as string,
        config.message(data),
        event,
      );
    }
  }
}
