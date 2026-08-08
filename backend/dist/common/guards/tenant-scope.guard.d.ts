import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../enums/role.enum';
export declare const TENANT_SCOPED_KEY = "tenant_scoped";
export declare const TenantScoped: () => {
    (target: Function): void;
    (target: Object, propertyKey: string | symbol): void;
};
export declare const ALLOWED_ROLES_KEY = "allowed_roles";
export declare const AllowRoles: (...roles: Role[]) => {
    (target: Function): void;
    (target: Object, propertyKey: string | symbol): void;
};
export declare class TenantScopeGuard implements CanActivate {
    private reflector;
    constructor(reflector: Reflector);
    canActivate(context: ExecutionContext): boolean;
}
