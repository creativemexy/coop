import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../enums/role.enum';

export const TENANT_SCOPED_KEY = 'tenant_scoped';
export const TenantScoped = () => Reflect.metadata(TENANT_SCOPED_KEY, true);

export const ALLOWED_ROLES_KEY = 'allowed_roles';
export const AllowRoles = (...roles: Role[]) =>
  Reflect.metadata(ALLOWED_ROLES_KEY, roles);

@Injectable()
export class TenantScopeGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isTenantScoped = this.reflector.get<boolean>(
      TENANT_SCOPED_KEY,
      context.getHandler(),
    );
    if (!isTenantScoped) {
      return true;
    }

    const request = context.switchToHttp().getRequest<
      Request & {
        user?: Record<string, unknown>;
        params?: Record<string, unknown>;
      }
    >();
    const user = request.user as Record<string, unknown>;
    const params = request.params as Record<string, unknown>;

    // super_admin bypasses tenant scoping
    if (user.role === Role.SUPER_ADMIN) {
      return true;
    }

    // business_manager is global, bypasses org scoping
    if (user.role === Role.BUSINESS_MANAGER) {
      return true;
    }

    // admin and operational_admin are apex-scoped
    if (user.role === Role.OPERATIONAL_ADMIN) {
      if (params.apexOrgId && params.apexOrgId !== user.apexOrgId) {
        throw new ForbiddenException('Access denied to this apex organization');
      }
      return true;
    }

    // org-scoped roles: accountant, loan_manager, bnpl_manager, investment_manager
    const orgScopedRoles = [
      Role.ACCOUNTANT,
      Role.LOAN_MANAGER,
      Role.BNPL_MANAGER,
      Role.INVESTMENT_MANAGER,
    ];

    if (orgScopedRoles.includes(user.role as Role)) {
      if (
        params.organizationId &&
        params.organizationId !== user.organizationId
      ) {
        throw new ForbiddenException('Access denied to this organization');
      }
      return true;
    }

    // individuals can only access their own data
    if (user.role === Role.INDIVIDUAL) {
      if (params.userId && params.userId !== user.sub) {
        throw new ForbiddenException('Access denied');
      }
      return true;
    }

    return true;
  }
}
