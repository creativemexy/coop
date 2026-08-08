import { Role } from './enums/role.enum';

const SUPPORT_ROLES: Role[] = [
  Role.BUSINESS_MANAGER,
  Role.SUPERVISOR,
  Role.BNPL_MANAGER,
  Role.OPERATIONAL_ADMIN,
  Role.APEX_BUSINESS_MANAGER,
  Role.ACCOUNTANT,
  Role.INVESTMENT_MANAGER,
  Role.OPERATIONS,
];

export function shouldMask(role?: Role): boolean {
  if (!role) return true;
  if (role === Role.SUPER_ADMIN) return false;
  return SUPPORT_ROLES.includes(role);
}

export function maskEmail(email?: string | null): string | null {
  if (!email) return null;
  const [name, domain] = email.split('@');
  if (!domain) return email;
  const visible = Math.min(2, name.length);
  return `${name.slice(0, visible)}***@${domain}`;
}

export function maskPhone(phone?: string | null): string | null {
  if (!phone) return null;
  if (phone.length <= 4) return '****';
  return '*'.repeat(phone.length - 4) + phone.slice(-4);
}

export function maskName(name?: string | null): string | null {
  if (!name) return null;
  if (name.length <= 1) return name;
  return name[0] + '*'.repeat(name.length - 1);
}

export function maskUser<T extends { email?: string | null; phone?: string | null; firstName?: string | null; lastName?: string | null }>(
  user: T,
  callerRole?: Role,
): T {
  if (!shouldMask(callerRole)) return user;
  return {
    ...user,
    email: maskEmail(user.email) ?? undefined,
    phone: maskPhone(user.phone) ?? undefined,
    firstName: maskName(user.firstName) ?? undefined,
    lastName: maskName(user.lastName) ?? undefined,
  };
}
