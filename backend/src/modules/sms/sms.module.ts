import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { SmsService } from './sms.service';
import { SmsEventDispatcher } from './sms-event-dispatcher';
import { TermiiClient } from './termii/termii.client';
import { SmsLog } from './entities/sms-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SmsLog]), HttpModule],
  providers: [SmsService, SmsEventDispatcher, TermiiClient],
  exports: [SmsService, SmsEventDispatcher],
})
export class SmsModule {}
