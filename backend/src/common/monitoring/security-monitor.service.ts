import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LoginHistory } from '../../modules/auth/entities/login-history.entity';
import { AlertService } from './alert.service';

const SUSPICIOUS_THRESHOLD = 10;
const RAPID_FAIL_WINDOW_MS = 5 * 60 * 1000;

@Injectable()
export class SecurityMonitorService {
  private readonly logger = new Logger(SecurityMonitorService.name);

  constructor(
    @InjectRepository(LoginHistory)
    private readonly loginRepo: Repository<LoginHistory>,
    private readonly alert: AlertService,
  ) {}

  async checkLoginAttempt(ipAddress?: string, userId?: string): Promise<void> {
    const since = new Date(Date.now() - RAPID_FAIL_WINDOW_MS);
    const where: any[] = [{ createdAt: LessThan(since) }];
    if (ipAddress) where[0].ipAddress = ipAddress;
    if (userId) where[0].userId = userId;

    const recentFails = await this.loginRepo.count({
      where: { ...where[0], success: false },
    });

    if (recentFails >= SUSPICIOUS_THRESHOLD) {
      await this.alert.alertSecurity(
        'Rapid failed login attempts',
        userId,
        { ipAddress, count: recentFails, windowMinutes: 5 },
      );
    }
  }

  async checkSuspiciousUserId(ipAddress: string, userIds: string[]): Promise<void> {
    if (userIds.length <= 1) return;
    await this.alert.alertSecurity(
      'Multiple user accounts from same IP',
      undefined,
      { ipAddress, userIds, count: userIds.length },
    );
  }

  @Cron(CronExpression.EVERY_30_MINUTES)
  async periodicScan(): Promise<void> {
    this.logger.log('Running security scan...');
    try {
      await this.checkAbnormalPatterns();
    } catch (err) {
      this.logger.error(`Security scan failed: ${(err as Error).message}`);
    }
  }

  private async checkAbnormalPatterns(): Promise<void> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const highFailIps = await this.loginRepo
      .createQueryBuilder('lh')
      .select('lh.ip_address', 'ip')
      .addSelect('COUNT(*)', 'cnt')
      .where('lh.created_at > :since', { since: oneHourAgo })
      .andWhere('lh.success = :success', { success: false })
      .groupBy('lh.ip_address')
      .having('COUNT(*) > :threshold', { threshold: 20 })
      .getRawMany();

    for (const row of highFailIps) {
      await this.alert.alertSecurity(
        `Suspicious IP: ${row.ip} - ${row.cnt} failed logins in 1 hour`,
        undefined,
        { ipAddress: row.ip, count: row.cnt, windowHours: 1 },
      );
    }
  }
}
