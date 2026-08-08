import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RetentionService } from './retention.service';
import { AuditService } from './audit.service';
import { LoginHistory } from '../modules/auth/entities/login-history.entity';
import { DeviceSession } from '../modules/auth/entities/device-session.entity';
import { UserActivity } from '../modules/users/entities/user-activity.entity';
import { AuditLog as BnplAuditLog } from '../modules/bnpl/entities/audit-log.entity';
import { SupportTicket } from '../modules/bnpl/entities/support-ticket.entity';
import { InAppNotification } from '../modules/notifications/entities/in-app-notification.entity';
import { SmsLog } from '../modules/sms/entities/sms-log.entity';
import { WebhookLog } from '../modules/payments/entities/webhook-log.entity';
import { KycSubmission } from '../modules/kyc/entities/kyc-submission.entity';
import { User } from '../modules/users/entities/user.entity';
import { AuditLog } from '../common/entities/audit-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LoginHistory,
      DeviceSession,
      UserActivity,
      BnplAuditLog,
      SupportTicket,
      InAppNotification,
      SmsLog,
      WebhookLog,
      KycSubmission,
      User,
      AuditLog,
    ]),
  ],
  providers: [RetentionService, AuditService],
  exports: [RetentionService, AuditService],
})
export class RetentionModule {}
