import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MonitoringService } from './monitoring.service';
import { AlertService } from './alert.service';
import { SecurityMonitorService } from './security-monitor.service';
import { LoginHistory } from '../../modules/auth/entities/login-history.entity';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([LoginHistory])],
  providers: [MonitoringService, AlertService, SecurityMonitorService],
  exports: [MonitoringService, AlertService, SecurityMonitorService],
})
export class MonitoringModule {}
