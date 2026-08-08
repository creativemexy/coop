"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shouldMask = shouldMask;
exports.maskEmail = maskEmail;
exports.maskPhone = maskPhone;
exports.maskName = maskName;
exports.maskUser = maskUser;
const role_enum_1 = require("./enums/role.enum");
const SUPPORT_ROLES = [
    role_enum_1.Role.BUSINESS_MANAGER,
    role_enum_1.Role.SUPERVISOR,
    role_enum_1.Role.BNPL_MANAGER,
    role_enum_1.Role.OPERATIONAL_ADMIN,
    role_enum_1.Role.APEX_BUSINESS_MANAGER,
    role_enum_1.Role.ACCOUNTANT,
    role_enum_1.Role.INVESTMENT_MANAGER,
    role_enum_1.Role.OPERATIONS,
];
function shouldMask(role) {
    if (!role)
        return true;
    if (role === role_enum_1.Role.SUPER_ADMIN)
        return false;
    return SUPPORT_ROLES.includes(role);
}
function maskEmail(email) {
    if (!email)
        return null;
    const [name, domain] = email.split('@');
    if (!domain)
        return email;
    const visible = Math.min(2, name.length);
    return `${name.slice(0, visible)}***@${domain}`;
}
function maskPhone(phone) {
    if (!phone)
        return null;
    if (phone.length <= 4)
        return '****';
    return '*'.repeat(phone.length - 4) + phone.slice(-4);
}
function maskName(name) {
    if (!name)
        return null;
    if (name.length <= 1)
        return name;
    return name[0] + '*'.repeat(name.length - 1);
}
function maskUser(user, callerRole) {
    if (!shouldMask(callerRole))
        return user;
    return {
        ...user,
        email: maskEmail(user.email) ?? undefined,
        phone: maskPhone(user.phone) ?? undefined,
        firstName: maskName(user.firstName) ?? undefined,
        lastName: maskName(user.lastName) ?? undefined,
    };
}
//# sourceMappingURL=mask.util.js.map