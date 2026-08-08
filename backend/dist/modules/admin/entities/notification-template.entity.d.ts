export declare enum TemplateType {
    SMS = "sms",
    EMAIL = "email"
}
export declare class NotificationTemplate {
    id: string;
    key: string;
    type: TemplateType;
    subject: string | null;
    body: string;
    variables: string[] | null;
    createdAt: Date;
    updatedAt: Date;
}
