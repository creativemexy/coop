import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import Tokens from 'csrf';
import type { Request } from 'express';

const tokens = new Tokens();

export function generateCsrfSecret(): string {
  return tokens.secretSync();
}

export function generateCsrfToken(secret: string): string {
  return tokens.create(secret);
}

function validateCsrfToken(secret: string, token: string): boolean {
  return tokens.verify(secret, token);
}

export const CSRF_COOKIE = 'csrf-secret';
export const CSRF_HEADER = 'x-csrf-token';
export const SKIP_CSRF_KEY = 'skipCsrf';
export const SkipCsrf = () => SetMetadata(SKIP_CSRF_KEY, true);

const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_CSRF_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skip) return true;

    const req: Request = context.switchToHttp().getRequest();

    if (SAFE_METHODS.includes(req.method)) return true;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const secret: string | undefined = req.cookies?.[CSRF_COOKIE];
    if (!secret) {
      throw new ForbiddenException('CSRF token missing');
    }

    const headerToken = req.headers[CSRF_HEADER] as string | undefined;
    if (!headerToken || !validateCsrfToken(secret, headerToken)) {
      throw new ForbiddenException('Invalid CSRF token');
    }

    return true;
  }
}
