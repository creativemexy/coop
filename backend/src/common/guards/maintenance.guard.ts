import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SettingsService } from '../../modules/settings/settings.service';

const ALLOWED_PATHS = [
  { method: 'GET', path: '/api/v1/branding/maintenance' },
  { method: 'GET', path: '/api/v1/auth/csrf-token' },
  { method: 'POST', path: '/api/v1/auth/login' },
  { method: 'POST', path: '/api/v1/auth/refresh' },
  { method: 'GET', path: '/api/v1/users/me' },
];

@Injectable()
export class MaintenanceGuard implements CanActivate {
  constructor(
    private readonly settings: SettingsService,
    private readonly jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const maintenanceMode = await this.settings.getValue('maintenance_mode');
    if (maintenanceMode !== 'true') return true;

    const req = context.switchToHttp().getRequest();
    const user = req.user || await this.getTokenUser(req);

    if (user?.role === 'super_admin') return true;

    const method = req.method;
    const path = req.path || req.route?.path || '';
    for (const allowed of ALLOWED_PATHS) {
      if (method === allowed.method && path.startsWith(allowed.path)) {
        return true;
      }
    }

    throw new ServiceUnavailableException('Platform is under maintenance. Please try again later.');
  }

  private async getTokenUser(req: any): Promise<{ role?: string } | null> {
    const authorization = req.headers?.authorization;
    if (!authorization?.startsWith('Bearer ')) return null;

    try {
      const payload = await this.jwtService.verifyAsync(authorization.slice(7));
      return { role: payload.role };
    } catch {
      return null;
    }
  }
}
