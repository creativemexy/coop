import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { Role } from '../enums/role.enum';
import { KycStatus } from '../enums/status.enum';
import { User } from '../../modules/users/entities/user.entity';

export const KYC_SKIP_KEY = 'kyc_skip';

const KYC_EXPIRY_MS = 365 * 24 * 60 * 60 * 1000;

@Injectable()
export class KycGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const skip = this.reflector.getAllAndOverride<boolean>(KYC_SKIP_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skip) return true;

    const request = context.switchToHttp().getRequest();
    const tokenUser = request.user;

    if (!tokenUser) return true;
    if (tokenUser.role !== Role.INDIVIDUAL) return true;

    const user = await this.entityManager.findOne(User, { where: { id: tokenUser.sub } });
    if (!user) return true;

    if (user.kycStatus !== KycStatus.APPROVED) {
      throw new ForbiddenException('KYC verification required to access this feature');
    }

    if (user.kycVerifiedAt && Date.now() - user.kycVerifiedAt.getTime() > KYC_EXPIRY_MS) {
      throw new ForbiddenException('KYC verification has expired. Please re-verify');
    }

    return true;
  }
}
