import { Repository } from 'typeorm';
import { InAppNotification, NotificationType } from './entities/in-app-notification.entity';
export declare class NotificationsService {
    private readonly repo;
    constructor(repo: Repository<InAppNotification>);
    findByUser(userId: string, limit?: number, offset?: number): Promise<{
        data: InAppNotification[];
        total: number;
        unread: number;
    }>;
    markAsRead(id: string, userId: string): Promise<void>;
    markAllAsRead(userId: string): Promise<void>;
    create(dto: {
        userId: string;
        title: string;
        message?: string;
        type?: NotificationType;
        link?: string;
    }): Promise<InAppNotification>;
    getUnreadCount(userId: string): Promise<number>;
    delete(id: string, userId: string): Promise<void>;
}
