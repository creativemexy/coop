import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupportController } from './support.controller';
import { SupportService } from './support.service';
import { WebhookLog } from '../payments/entities/webhook-log.entity';
import { SupportTicket } from '../bnpl/entities/support-ticket.entity';
import { TicketMessage } from './entities/ticket-message.entity';
import { AuditLog } from '../bnpl/entities/audit-log.entity';
import { BnplSubscription } from '../bnpl/entities/bnpl-subscription.entity';
import { BnplInstallment } from '../bnpl/entities/bnpl-installment.entity';
import { Payment } from '../payments/entities/payment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WebhookLog,
      SupportTicket,
      TicketMessage,
      AuditLog,
      BnplSubscription,
      BnplInstallment,
      Payment,
    ]),
  ],
  controllers: [SupportController],
  providers: [SupportService],
})
export class SupportModule {}
