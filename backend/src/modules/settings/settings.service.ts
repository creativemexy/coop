import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppSetting } from './entities/app-setting.entity';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(AppSetting)
    private readonly repo: Repository<AppSetting>,
  ) {}

  async get(key: string): Promise<AppSetting | null> {
    return this.repo.findOne({ where: { key } });
  }

  async getValue(key: string): Promise<string | null> {
    const setting = await this.get(key);
    return setting?.value ?? null;
  }

  async getNumber(key: string, fallback: number = 0): Promise<number> {
    const val = await this.getValue(key);
    return val ? Number(val) : fallback;
  }

  async set(key: string, value: string): Promise<AppSetting> {
    const existing = await this.get(key);
    if (existing) {
      existing.value = value;
      return this.repo.save(existing);
    }
    return this.repo.save(this.repo.create({ key, value }));
  }
}
