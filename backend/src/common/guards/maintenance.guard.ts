import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { CanActivate, ExecutionContext } from '@nestjs/common';
import { SettingsService } from '../../modules/settings/settings.service';

const ALLOWED_PATHS = [
  { method: 'GET', path: '/api/v1/savings' },
  { method: 'POST', path: '/api/v1/savings/deposit' },
];

@Injectable()
export class MaintenanceGuard implements CanActivate {
  constructor(private readonly settings: SettingsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const maintenanceMode = await this.settings.getValue('maintenance_mode');
    if (maintenanceMode !== 'true') return true;

    const req = context.switchToHttp().getRequest();
    const user = req.user;

    if (user?.role === 'super_admin') return true;

    const method = req.method;
    const path = req.path || req.route?.path || '';
    for (const allowed of ALLOWED_PATHS) {
      if (method === allowed.method && path.startsWith(allowed.path)) {
        return true;
      }
    }

    throw new ServiceUnavailableException('Platform is under maintenance. Only savings and deposits are available.');
  }
}
