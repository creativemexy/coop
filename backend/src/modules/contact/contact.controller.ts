import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../email/email.service';
import { ContactDto } from './dto/contact.dto';
import { sanitizeInput } from '../../common/sanitize.util';

const DEFAULT_CONTACT_INBOX = 'hello@fenacoop.org';

/**
 * Public contact form handler (landing page).
 *
 * Validates + sanitises the submission, then delivers it to the site's
 * contact inbox via the platform email service (SMTP; falls back to a
 * masked stub log when credentials are not configured).
 */
@Controller('api/v1/contact')
export class ContactController {
  constructor(
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async submit(@Body() dto: ContactDto) {
    if (dto.consent !== true) {
      throw new BadRequestException(
        'Your consent is required before we can receive your message.',
      );
    }

    const name = sanitizeInput(dto.name);
    const email = sanitizeInput(dto.email).toLowerCase().trim();
    const message = sanitizeInput(dto.message);

    const inbox =
      this.configService.get<string>('CONTACT_FORM_TO')?.trim() ||
      DEFAULT_CONTACT_INBOX;

    await this.emailService.send({
      to: inbox,
      subject: `Website enquiry from ${name}`,
      text: [`Name: ${name}`, `Email: ${email}`, '', 'Message:', message].join(
        '\n',
      ),
    });

    return {
      message:
        'Thank you. Your message has been sent — we will get back to you shortly.',
    };
  }
}
