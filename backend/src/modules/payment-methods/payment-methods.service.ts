import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SavedPaymentMethod, PaymentMethodType } from './entities/saved-payment-method.entity';

@Injectable()
export class PaymentMethodsService {
  constructor(
    @InjectRepository(SavedPaymentMethod)
    private readonly repo: Repository<SavedPaymentMethod>,
  ) {}

  async findByUser(userId: string) {
    return this.repo.find({ where: { userId, isActive: true }, order: { isDefault: 'DESC', createdAt: 'DESC' } });
  }

  async create(userId: string, dto: {
    type: PaymentMethodType;
    provider: string;
    providerToken?: string;
    last4?: string;
    cardBrand?: string;
    expiryMonth?: string;
    expiryYear?: string;
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
    isDefault?: boolean;
  }) {
    if (dto.isDefault) {
      await this.repo.update({ userId, isDefault: true }, { isDefault: false });
    }
    const method = this.repo.create({ userId, ...dto });
    return this.repo.save(method);
  }

  async update(id: string, userId: string, dto: Partial<{ isDefault: boolean }>) {
    const method = await this.repo.findOne({ where: { id, userId } });
    if (!method) throw new NotFoundException('Payment method not found');
    if (dto.isDefault) {
      await this.repo.update({ userId, isDefault: true }, { isDefault: false });
    }
    await this.repo.update(id, dto);
    return this.repo.findOne({ where: { id } });
  }

  async remove(id: string, userId: string) {
    const result = await this.repo.delete({ id, userId });
    if (result.affected === 0) throw new NotFoundException('Payment method not found');
  }
}
