import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { Request } from 'express';

@Injectable()
export class WebhookAuthGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const secret = this.configService.get<string>('WEBHOOK_SECRET');
    if (!secret) {
      // Fail closed: never accept a webhook when the shared secret is unset.
      throw new UnauthorizedException('Webhook endpoint misconfigured');
    }

    const request = context.switchToHttp().getRequest<Request>();
    const provided =
      (request.headers['x-webhook-secret'] as string | undefined) ?? '';

    const a = Buffer.from(provided);
    const b = Buffer.from(secret);
    const valid = a.length === b.length && crypto.timingSafeEqual(a, b);
    if (!valid) {
      throw new UnauthorizedException('Invalid or missing webhook secret');
    }

    return true;
  }
}
