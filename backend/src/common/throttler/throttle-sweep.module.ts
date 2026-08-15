import { Module } from '@nestjs/common';
import { ThrottleSweepService } from './throttle-sweep.service';

@Module({
  providers: [ThrottleSweepService],
  exports: [ThrottleSweepService],
})
export class ThrottleSweepModule {}