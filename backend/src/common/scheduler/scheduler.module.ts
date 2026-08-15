import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobLock } from './job-lock.entity';
import { SchedulerLockService } from './scheduler-lock.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([JobLock])],
  providers: [SchedulerLockService],
  exports: [SchedulerLockService],
})
export class SchedulerModule {}