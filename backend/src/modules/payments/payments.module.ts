import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { WebhooksController } from './webhooks/webhooks.controller';
import { PaystackClient } from './providers/paystack/paystack.client';
import { Payment } from './entities/payment.entity';
import { WebhookLog } from './entities/webhook-log.entity';
import { User } from '../users/entities/user.entity';
import { BnplModule } from '../bnpl/bnpl.module';
import { UsersModule } from '../users/users.module';
import { LedgerModule } from '../ledger/ledger.module';

@Module({
  imports: [TypeOrmModule.forFeature([Payment, User, WebhookLog]), HttpModule, BnplModule, UsersModule, LedgerModule],
  controllers: [PaymentsController, WebhooksController],
  providers: [PaymentsService, PaystackClient],
  exports: [PaymentsService, PaystackClient],
})
export class PaymentsModule {}
