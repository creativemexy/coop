import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { EntityManager } from 'typeorm';
export declare const KYC_SKIP_KEY = "kyc_skip";
export declare class KycGuard implements CanActivate {
    private readonly reflector;
    private readonly entityManager;
    constructor(reflector: Reflector, entityManager: EntityManager);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
