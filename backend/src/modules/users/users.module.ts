import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { Referral } from './entities/referral.entity';
import { UserActivity } from './entities/user-activity.entity';
import { ReferralsService } from './referrals.service';
import { UserActivityService } from './user-activity.service';
import { RetentionModule } from '../../common/retention.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, Referral, UserActivity]), RetentionModule],
  controllers: [UsersController],
  providers: [UsersService, ReferralsService, UserActivityService],
  exports: [UsersService, ReferralsService, UserActivityService],
})
export class UsersModule {}
