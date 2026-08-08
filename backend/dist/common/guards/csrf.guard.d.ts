import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
export declare function generateCsrfSecret(): string;
export declare function generateCsrfToken(secret: string): string;
export declare const CSRF_COOKIE = "csrf-secret";
export declare const CSRF_HEADER = "x-csrf-token";
export declare const SKIP_CSRF_KEY = "skipCsrf";
export declare const SkipCsrf: () => import("@nestjs/common").CustomDecorator<string>;
export declare class CsrfGuard implements CanActivate {
    private readonly reflector;
    constructor(reflector: Reflector);
    canActivate(context: ExecutionContext): boolean;
}
