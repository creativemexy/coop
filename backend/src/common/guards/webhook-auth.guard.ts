import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class WebhookAuthGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const secret = this.configService.get<string>('WEBHOOK_SECRET');
    if (!secret) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const headerSecret = request.headers['x-webhook-secret'] as string | undefined;

    if (!headerSecret || headerSecret !== secret) {
      throw new UnauthorizedException('Invalid or missing webhook secret');
    }

    return true;
  }
}
