export declare class IdempotencyKey {
    id: string;
    idempotencyKey: string;
    operation: string;
    referenceId: string;
    status: string;
    result: Record<string, any>;
    createdAt: Date;
}
