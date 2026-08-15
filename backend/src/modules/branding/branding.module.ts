import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { BrandingController } from './branding.controller';
import { SettingsModule } from '../settings/settings.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { SavingsAccount } from '../savings/entities/savings-account.entity';
import { InvestmentHolding } from '../investments/entities/investment-holding.entity';

@Module({
  imports: [
    MulterModule.register({ dest: './uploads/branding' }),
    SettingsModule,
    TypeOrmModule.forFeature([User, Organization, SavingsAccount, InvestmentHolding]),
  ],
  controllers: [BrandingController],
})
export class BrandingModule {}
