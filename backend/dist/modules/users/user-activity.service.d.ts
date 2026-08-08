import { Repository } from 'typeorm';
import { UserActivity } from './entities/user-activity.entity';
export declare class UserActivityService {
    private readonly repo;
    constructor(repo: Repository<UserActivity>);
    log(userId: string, action: string, details?: Record<string, any>, ipAddress?: string): Promise<UserActivity>;
    findByUser(userId: string, limit?: number, offset?: number): Promise<{
        data: UserActivity[];
        total: number;
    }>;
}
