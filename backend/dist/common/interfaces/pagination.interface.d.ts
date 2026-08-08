export interface PaginatedResult<T> {
    data: T[];
    meta: {
        total: number;
        limit: number;
        cursor?: string;
        hasMore: boolean;
    };
}
export interface PaginationParams {
    limit?: number;
    cursor?: string;
    offset?: number;
}
