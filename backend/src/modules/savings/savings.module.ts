import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SavingsController } from './savings.controller';
import { SavingsService } from './savings.service';
import { SavingsAccount } from './entities/savings-account.entity';
import { SavingsTransaction } from './entities/savings-transaction.entity';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SavingsAccount, SavingsTransaction]),
    UsersModule,
    NotificationsModule,
  ],
  controllers: [SavingsController],
  providers: [SavingsService],
  exports: [SavingsService],
})
export class SavingsModule {}
