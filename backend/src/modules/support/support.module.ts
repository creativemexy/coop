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
import { User } from '../users/entities/user.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { RealtimeModule } from '../realtime/realtime.module';

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
      User,
    ]),
    NotificationsModule,
    RealtimeModule,
  ],
  controllers: [SupportController],
  providers: [SupportService],
})
export class SupportModule {}
