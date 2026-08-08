import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeviceSession } from './entities/device-session.entity';

@Injectable()
export class DeviceSessionService {
  private readonly logger = new Logger(DeviceSessionService.name);

  constructor(
    @InjectRepository(DeviceSession)
    private readonly repo: Repository<DeviceSession>,
  ) {}

  async checkDevice(
    userId: string,
    deviceFingerprint: string,
    deviceInfo?: {
      deviceName?: string;
      deviceType?: string;
      os?: string;
      browser?: string;
      ipAddress?: string;
    },
  ): Promise<{
    isNewDevice: boolean;
    isTrusted: boolean;
    deviceSession: DeviceSession;
  }> {
    // Look for existing device session
    const existing = await this.repo.findOne({
      where: { userId, deviceFingerprint },
    });

    if (existing) {
      // Update last used timestamp
      existing.lastUsedAt = new Date();
      if (deviceInfo?.ipAddress) existing.ipAddress = deviceInfo.ipAddress;
      await this.repo.save(existing);
      return {
        isNewDevice: false,
        isTrusted: existing.isTrusted,
        deviceSession: existing,
      };
    }

    // New device detected
    const session = this.repo.create({
      userId,
      deviceFingerprint,
      deviceName: deviceInfo?.deviceName || 'Unknown',
      deviceType: deviceInfo?.deviceType || 'unknown',
      os: deviceInfo?.os || '',
      browser: deviceInfo?.browser || '',
      ipAddress: deviceInfo?.ipAddress || '',
      isTrusted: false,
      lastUsedAt: new Date(),
    });
    const saved = await this.repo.save(session);

    this.logger.warn(
      `New device login detected for user ${userId}: ${saved.deviceName} (${saved.deviceType})`,
    );

    // In production: send notification email/SMS about new device login
    // await this.smsEventDispatcher.emit('new_device_login', { userId, deviceName: saved.deviceName });

    return { isNewDevice: true, isTrusted: false, deviceSession: saved };
  }

  async trustDevice(userId: string, deviceFingerprint: string): Promise<void> {
    await this.repo.update({ userId, deviceFingerprint }, { isTrusted: true });
  }

  async removeDevice(userId: string, deviceFingerprint: string): Promise<void> {
    await this.repo.delete({ userId, deviceFingerprint });
  }

  async getUserDevices(userId: string): Promise<DeviceSession[]> {
    return this.repo.find({
      where: { userId },
      order: { lastUsedAt: 'DESC' },
    });
  }

  async removeAllDevices(
    userId: string,
    exceptFingerprint?: string,
  ): Promise<void> {
    if (exceptFingerprint) {
      await this.repo.delete({ userId, deviceFingerprint: exceptFingerprint });
    } else {
      await this.repo.delete({ userId });
    }
  }
}
