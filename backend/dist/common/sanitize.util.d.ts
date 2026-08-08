export declare function sanitizeInput(input: string): string;
export declare function sanitizeObject<T extends Record<string, any>>(obj: T, fields: (keyof T)[]): T;
