import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InAppNotification, NotificationType } from './entities/in-app-notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(InAppNotification)
    private readonly repo: Repository<InAppNotification>,
  ) {}

  async findByUser(userId: string, limit = 50, offset = 0) {
    const [data, total] = await this.repo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
    return { data, total, unread: await this.repo.count({ where: { userId, isRead: false } }) };
  }

  async markAsRead(id: string, userId: string) {
    await this.repo.update({ id, userId }, { isRead: true });
  }

  async markAllAsRead(userId: string) {
    await this.repo.update({ userId, isRead: false }, { isRead: true });
  }

  async create(dto: { userId: string; title: string; message?: string; type?: NotificationType; link?: string }) {
    const notification = this.repo.create(dto);
    return this.repo.save(notification);
  }

  async getUnreadCount(userId: string) {
    return this.repo.count({ where: { userId, isRead: false } });
  }

  async delete(id: string, userId: string) {
    await this.repo.delete({ id, userId });
  }
}
