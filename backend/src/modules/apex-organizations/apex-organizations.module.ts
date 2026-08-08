import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApexOrganizationsController } from './apex-organizations.controller';
import { ApexOrganizationsService } from './apex-organizations.service';
import { ApexOrganization } from './entities/apex-organization.entity';
import { User } from '../users/entities/user.entity';
import { PaymentsModule } from '../payments/payments.module';
import { SmsModule } from '../sms/sms.module';

@Module({
  imports: [TypeOrmModule.forFeature([ApexOrganization, User]), PaymentsModule, SmsModule],
  controllers: [ApexOrganizationsController],
  providers: [ApexOrganizationsService],
  exports: [ApexOrganizationsService],
})
export class ApexOrganizationsModule {}
