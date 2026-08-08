import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApexBusinessManagerController } from './apex-business-manager.controller';
import { ApexBusinessManagerService } from './apex-business-manager.service';
import { ApexOrganization } from '../apex-organizations/entities/apex-organization.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { User } from '../users/entities/user.entity';
import { FeeShareLedger } from '../ledger/entities/fee-share-ledger.entity';
import { FeePot } from '../ledger/entities/fee-pot.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ApexOrganization, Organization, User, FeeShareLedger, FeePot]),
  ],
  controllers: [ApexBusinessManagerController],
  providers: [ApexBusinessManagerService],
})
export class ApexBusinessManagerModule {}
