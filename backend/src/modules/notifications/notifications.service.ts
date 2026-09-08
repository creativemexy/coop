import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { InAppNotification, NotificationType } from './entities/in-app-notification.entity';
import { User } from '../users/entities/user.entity';
import { Role } from '../../common/enums/role.enum';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(InAppNotification)
    private readonly repo: Repository<InAppNotification>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
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

  async create(dto: { userId: string; title: string; message?: string; type?: NotificationType | string; link?: string }) {
    const notification = this.repo.create({ ...dto, type: (dto.type as NotificationType) || NotificationType.INFO });
    return this.repo.save(notification);
  }

  async getUnreadCount(userId: string) {
    return this.repo.count({ where: { userId, isRead: false } });
  }

  async delete(id: string, userId: string) {
    await this.repo.delete({ id, userId });
  }

  /** Broadcast an in-app message to all app users (individual members). */
  async broadcast(dto: { title: string; message?: string; type?: NotificationType; link?: string }) {
    const users = await this.userRepo.find({ where: { role: In(Role.INDIVIDUAL ? [Role.INDIVIDUAL] : []) } });
    if (users.length === 0) return { sent: 0 };
    const notifications = users.map((u) =>
      this.repo.create({
        userId: u.id,
        title: dto.title,
        message: dto.message,
        type: dto.type || NotificationType.INFO,
        link: dto.link,
      }),
    );
    const saved = await this.repo.save(notifications);
    return { sent: saved.length };
  }
}