import { Role } from './enums/role.enum';
export declare function shouldMask(role?: Role): boolean;
export declare function maskEmail(email?: string | null): string | null;
export declare function maskPhone(phone?: string | null): string | null;
export declare function maskName(name?: string | null): string | null;
export declare function maskUser<T extends {
    email?: string | null;
    phone?: string | null;
    firstName?: string | null;
    lastName?: string | null;
}>(user: T, callerRole?: Role): T;
