import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GlobalRiskRule } from '../modules/admin/entities/global-risk-rule.entity';
import { RiskService } from './risk.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([GlobalRiskRule])],
  providers: [RiskService],
  exports: [RiskService],
})
export class RiskModule {}
