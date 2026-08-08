import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, Transporter } from 'nodemailer';
import { maskEmail } from '../../common/mask.util';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter | null = null;
  private configured = false;

  constructor(private configService: ConfigService) {
    const host = this.configService.get<string>('smtp.host');
    const port = this.configService.get<number>('smtp.port');
    const user = this.configService.get<string>('smtp.user');
    const pass = this.configService.get<string>('smtp.pass');
    const from = this.configService.get<string>('smtp.from');

    if (host && user && pass) {
      this.transporter = createTransport({
        host,
        port: port || 587,
        secure: (port || 587) === 465,
        auth: { user, pass },
      });
      this.configured = true;
      this.logger.log(`SMTP configured: ${host}:${port}`);
    } else {
      this.logger.warn('SMTP not configured — emails will be logged only');
    }
  }

  async send(options: { to: string; subject: string; text?: string; html?: string }): Promise<void> {
    if (!this.configured || !this.transporter) {
      this.logger.log(`[EMAIL LOG] To: ${maskEmail(options.to)} | Subject: ${options.subject}`);
      return;
    }

    try {
      const from = this.configService.get<string>('smtp.from') || 'noreply@coop.com';
      await this.transporter.sendMail({ from, ...options });
      this.logger.log(`Email sent to ${maskEmail(options.to)}: ${options.subject}`);
    } catch (err) {
      this.logger.error(`Failed to send email to ${maskEmail(options.to)}: ${(err as Error).message}`);
    }
  }
}
