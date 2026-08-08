declare const _default: (() => {
    port: number;
    env: string;
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    port: number;
    env: string;
}>;
export default _default;
export declare const smtpConfig: (() => {
    host: string;
    port: number;
    user: string;
    pass: string;
    from: string;
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    host: string;
    port: number;
    user: string;
    pass: string;
    from: string;
}>;
