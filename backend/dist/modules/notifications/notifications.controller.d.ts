import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
    private readonly service;
    constructor(service: NotificationsService);
    findAll(userId: string, limit?: string, offset?: string): Promise<{
        data: import("./entities/in-app-notification.entity").InAppNotification[];
        total: number;
        unread: number;
    }>;
    unreadCount(userId: string): Promise<number>;
    markRead(id: string, userId: string): Promise<void>;
    markAllRead(userId: string): Promise<void>;
    remove(id: string, userId: string): Promise<void>;
}
