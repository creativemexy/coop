import { Role } from '../enums/role.enum';
export interface JwtPayload {
    sub: string;
    email: string;
    role: Role;
    apexOrgId?: string;
    organizationId?: string;
    iat?: number;
    exp?: number;
}
