export declare enum AuditAction {
    LOGIN = "LOGIN",
    LOGIN_FAILED = "LOGIN_FAILED",
    LOGOUT = "LOGOUT",
    PASSWORD_CHANGE = "PASSWORD_CHANGE",
    PASSWORD_RESET = "PASSWORD_RESET",
    USER_CREATE = "USER_CREATE",
    USER_UPDATE = "USER_UPDATE",
    USER_DEACTIVATE = "USER_DEACTIVATE",
    USER_DELETE = "USER_DELETE",
    ROLE_CHANGE = "ROLE_CHANGE",
    KYC_SUBMIT = "KYC_SUBMIT",
    KYC_APPROVE = "KYC_APPROVE",
    KYC_REJECT = "KYC_REJECT",
    SETTINGS_CHANGE = "SETTINGS_CHANGE",
    BRANDING_CHANGE = "BRANDING_CHANGE",
    RETENTION_PURGE = "RETENTION_PURGE",
    LOAN_APPROVE = "LOAN_APPROVE",
    LOAN_REJECT = "LOAN_REJECT"
}
export declare class AuditLog {
    id: string;
    action: AuditAction;
    entityType: string;
    entityId: string;
    performedBy: string;
    metadata: Record<string, any>;
    ipAddress: string;
    createdAt: Date;
}
