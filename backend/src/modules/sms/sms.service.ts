import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SmsLog } from './entities/sms-log.entity';
import { SmsProvider, SmsStatus } from '../../common/enums/status.enum';
import { TermiiClient } from './termii/termii.client';
import { maskPhone } from '../../common/mask.util';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(
    @InjectRepository(SmsLog)
    private readonly repo: Repository<SmsLog>,
    private readonly termiiClient: TermiiClient,
  ) {}

  async send(
    recipient: string,
    message: string,
    eventType: string,
  ): Promise<void> {
    try {
      const sent = await this.termiiClient.sendSms(recipient, message);

      await this.repo.save({
        recipient,
        message,
        eventType,
        provider: SmsProvider.TERMII,
        status: sent ? SmsStatus.SENT : SmsStatus.FAILED,
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to send SMS to ${maskPhone(recipient)}: ${errorMessage}`);
      await this.repo.save({
        recipient,
        message,
        eventType,
        provider: SmsProvider.TERMII,
        status: SmsStatus.FAILED,
        providerResponse: { error: errorMessage },
      });
    }
  }
}
