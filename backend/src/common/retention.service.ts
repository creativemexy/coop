import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Repository, LessThan, IsNull } from 'typeorm';
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
import { AuditService } from './audit.service';
import { AuditAction } from './entities/audit-log.entity';

const ANONYMIZED_EMAIL = 'anonymized@deleted.user';
const ANONYMIZED_PREFIX = 'ANONYMIZED_';

@Injectable()
export class RetentionService {
  private readonly logger = new Logger(RetentionService.name);
  private readonly defaults: Record<string, number> = {
    login_history: 90,
    device_sessions: 180,
    user_activities: 90,
    sms_logs: 90,
    webhook_logs: 30,
    bnpl_audit_logs: 365,
    support_tickets: 365,
    in_app_notifications: 30,
    kyc_submissions: 1825,
  };

  constructor(
    private readonly config: ConfigService,
    private readonly auditService: AuditService,
    @InjectRepository(LoginHistory)
    private readonly loginRepo: Repository<LoginHistory>,
    @InjectRepository(DeviceSession)
    private readonly deviceRepo: Repository<DeviceSession>,
    @InjectRepository(UserActivity)
    private readonly activityRepo: Repository<UserActivity>,
    @InjectRepository(BnplAuditLog)
    private readonly auditRepo: Repository<BnplAuditLog>,
    @InjectRepository(SupportTicket)
    private readonly ticketRepo: Repository<SupportTicket>,
    @InjectRepository(InAppNotification)
    private readonly notifRepo: Repository<InAppNotification>,
    @InjectRepository(SmsLog)
    private readonly smsRepo: Repository<SmsLog>,
    @InjectRepository(WebhookLog)
    private readonly webhookRepo: Repository<WebhookLog>,
    @InjectRepository(KycSubmission)
    private readonly kycRepo: Repository<KycSubmission>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  private daysAgo(n: number): Date {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d;
  }

  private retentionDays(key: string): number {
    const envKey = `RETENTION_${key.toUpperCase()}_DAYS`;
    return Number(this.config.get(envKey)) || this.defaults[key] || 365;
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async purgeAll(): Promise<Record<string, number>> {
    const results: Record<string, number> = {};

    const purge = async (
      key: string,
      repo: Repository<any>,
    ): Promise<number> => {
      const days = this.retentionDays(key);
      const deleted = await repo.delete({
        createdAt: LessThan(this.daysAgo(days)),
      });
      return deleted.affected ?? 0;
    };

    results.login_history = await purge('login_history', this.loginRepo);
    results.device_sessions = await purge('device_sessions', this.deviceRepo);
    results.user_activities = await purge('user_activities', this.activityRepo);
    results.sms_logs = await purge('sms_logs', this.smsRepo);
    results.webhook_logs = await purge('webhook_logs', this.webhookRepo);
    results.bnpl_audit_logs = await purge('bnpl_audit_logs', this.auditRepo);
    results.support_tickets = await purge('support_tickets', this.ticketRepo);
    results.in_app_notifications = await purge(
      'in_app_notifications',
      this.notifRepo,
    );
    results.kyc_anonymized = await this.anonymizeKycDocuments();
    results.kyc_submissions = await purge('kyc_submissions', this.kycRepo);

    const anonymized = await this.anonymizeInactiveUsers();

    await this.auditService.log(AuditAction.RETENTION_PURGE, {
      metadata: { purged: results, anonymized },
    });

    this.logger.log(
      `Retention purge complete: ${JSON.stringify(results)}, anonymized: ${anonymized}`,
    );
    return { ...results, users_anonymized: anonymized };
  }

  async anonymizeKycDocuments(): Promise<number> {
    const days = this.retentionDays('kyc_submissions');
    const cutoff = this.daysAgo(days);
    const result = await this.kycRepo
      .createQueryBuilder()
      .update()
      .set({ providerResponse: null as any, rejectionReason: null as any })
      .where('created_at < :cutoff', { cutoff })
      .andWhere('provider_response IS NOT NULL')
      .execute();
    return result.affected ?? 0;
  }

  async anonymizeInactiveUsers(): Promise<number> {
    const retentionDays =
      Number(this.config.get('RETENTION_USER_ACCOUNT_DAYS')) || 730;
    const cutoff = this.daysAgo(retentionDays);

    const users = await this.userRepo.find({
      where: [
        { isActive: false, updatedAt: LessThan(cutoff), emailHash: IsNull() },
        { isActive: false, updatedAt: LessThan(cutoff), email: IsNull() },
      ],
    });

    for (const user of users) {
      Object.assign(user, {
        email: ANONYMIZED_EMAIL,
        emailHash: `anonymized_${user.id}`,
        phone: null,
        phoneHash: null,
        firstName: ANONYMIZED_PREFIX,
        lastName: ANONYMIZED_PREFIX,
        passwordHash: ANONYMIZED_PREFIX,
        refreshTokenHash: null,
        resetToken: null,
        resetTokenExpiry: null,
        socialProvider: null,
        socialId: null,
        kycReference: null,
        notificationPreferences: null,
        referralCode: null,
        referredBy: null,
        referralCount: 0,
        referralEarnings: 0,
        failedAttempts: 0,
        lockedUntil: null,
      });
      await this.userRepo.save(user);
    }

    return users.length;
  }
}
