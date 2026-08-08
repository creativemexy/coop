import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { maskPhone } from '../../../common/mask.util';

@Injectable()
export class TermiiClient {
  private readonly logger = new Logger(TermiiClient.name);
  private readonly apiKey: string;
  private readonly senderId: string;
  private readonly baseUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.apiKey = configService.get<string>('TERMII_API_KEY') || '';
    this.senderId = configService.get<string>('TERMII_SENDER_ID') || 'CoopBNPL';
    this.baseUrl = 'https://api.termii.com';
  }

  async sendSms(recipient: string, message: string): Promise<boolean> {
    if (!this.apiKey) {
      this.logger.warn('Termii API key not configured, logging SMS instead');
      this.logger.log(`[SMS Stub] To: ${maskPhone(recipient)}, Message: ${message}`);
      return true;
    }

    try {
      await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/api/sms/send`,
          {
            api_key: this.apiKey,
            to: recipient,
            from: this.senderId,
            sms: message,
            type: 'plain',
            channel: 'generic',
          },
          {
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      );

      this.logger.log(`SMS sent to ${maskPhone(recipient)} via Termii`);
      return true;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Termii SMS failed for ${maskPhone(recipient)}: ${errorMessage}`);
      return false;
    }
  }
}
