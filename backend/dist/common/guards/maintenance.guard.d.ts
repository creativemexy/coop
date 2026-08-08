import { CanActivate, ExecutionContext } from '@nestjs/common';
import { SettingsService } from '../../modules/settings/settings.service';
export declare class MaintenanceGuard implements CanActivate {
    private readonly settings;
    constructor(settings: SettingsService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
