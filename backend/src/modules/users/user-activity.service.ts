import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserActivity } from './entities/user-activity.entity';

@Injectable()
export class UserActivityService {
  constructor(
    @InjectRepository(UserActivity)
    private readonly repo: Repository<UserActivity>,
  ) {}

  async log(userId: string, action: string, details?: Record<string, any>, ipAddress?: string) {
    const activity = this.repo.create({ userId, action, details, ipAddress });
    return this.repo.save(activity);
  }

  async findByUser(userId: string, limit = 50, offset = 0) {
    const [data, total] = await this.repo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
    return { data, total };
  }
}
