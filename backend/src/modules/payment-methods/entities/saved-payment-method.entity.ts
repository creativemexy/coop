import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum PaymentMethodType {
  CARD = 'card',
  BANK = 'bank',
}

@Entity('saved_payment_methods')
export class SavedPaymentMethod {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'user_id' })
  userId: string;

  @Column({ type: 'enum', enum: PaymentMethodType })
  type: PaymentMethodType;

  @Column({ length: 50 })
  provider: string;

  @Column({ name: 'provider_token', length: 255, nullable: true })
  providerToken: string;

  @Column({ name: 'last4', length: 4, nullable: true })
  last4: string;

  @Column({ name: 'card_brand', length: 50, nullable: true })
  cardBrand: string;

  @Column({ name: 'expiry_month', length: 2, nullable: true })
  expiryMonth: string;

  @Column({ name: 'expiry_year', length: 4, nullable: true })
  expiryYear: string;

  @Column({ name: 'bank_name', length: 255, nullable: true })
  bankName: string;

  @Column({ name: 'account_number', length: 20, nullable: true })
  accountNumber: string;

  @Column({ name: 'account_name', length: 255, nullable: true })
  accountName: string;

  @Column({ name: 'is_default', default: false })
  isDefault: boolean;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
