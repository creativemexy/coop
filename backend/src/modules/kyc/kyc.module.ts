import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { KycController } from './kyc.controller';
import { KycService } from './kyc.service';
import { KorapayClient } from './korapay/korapay.client';
import { KycSubmission } from './entities/kyc-submission.entity';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([KycSubmission]), HttpModule, UsersModule, NotificationsModule],
  controllers: [KycController],
  providers: [KycService, KorapayClient],
  exports: [KycService],
})
export class KycModule {}
