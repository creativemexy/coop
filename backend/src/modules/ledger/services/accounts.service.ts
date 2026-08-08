import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from '../entities/account.entity';
import { AccountType } from '../../../common/enums/status.enum';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(Account)
    private readonly repo: Repository<Account>,
  ) {}

  async create(dto: {
    code: string;
    name: string;
    type: AccountType;
    description?: string;
    organizationId?: string;
  }): Promise<Account> {
    const existing = await this.repo.findOne({ where: { code: dto.code } });
    if (existing) {
      throw new BadRequestException(`An account with code "${dto.code}" already exists`);
    }
    const account = this.repo.create({ ...dto, isSystem: false });
    return this.repo.save(account);
  }

  async findAll(organizationId?: string): Promise<Account[]> {
    const where: Record<string, unknown> = {};
    if (organizationId) where.organizationId = organizationId;
    return this.repo.find({ where, order: { code: 'ASC' } });
  }

  async findById(id: string): Promise<Account> {
    const account = await this.repo.findOne({ where: { id } });
    if (!account) throw new NotFoundException('Account not found');
    return account;
  }

  async findByCode(code: string): Promise<Account | null> {
    return this.repo.findOne({ where: { code } });
  }

  async update(
    id: string,
    dto: {
      code?: string;
      name?: string;
      type?: AccountType;
      description?: string;
      isActive?: boolean;
    },
  ): Promise<Account> {
    const account = await this.findById(id);

    if (dto.code && dto.code !== account.code) {
      const existing = await this.repo.findOne({ where: { code: dto.code } });
      if (existing) {
        throw new BadRequestException(`An account with code "${dto.code}" already exists`);
      }
    }

    if (account.isSystem) {
      throw new BadRequestException('System accounts cannot be edited. Create a new account instead.');
    }

    if (dto.code) account.code = dto.code;
    if (dto.name !== undefined) account.name = dto.name;
    if (dto.type !== undefined) account.type = dto.type;
    if (dto.description !== undefined) account.description = dto.description;
    if (dto.isActive !== undefined) account.isActive = dto.isActive;

    return this.repo.save(account);
  }
}
