import { SettingsService } from './settings.service';
export declare class SettingsController {
    private readonly service;
    constructor(service: SettingsService);
    get(key: string): Promise<import("./entities/app-setting.entity").AppSetting | {
        key: string;
        value: null;
    }>;
    update(key: string, dto: {
        value: string;
    }): Promise<import("./entities/app-setting.entity").AppSetting>;
}
