import { Repository } from 'typeorm';
import { AppSetting } from './entities/app-setting.entity';
export declare class SettingsService {
    private readonly repo;
    constructor(repo: Repository<AppSetting>);
    get(key: string): Promise<AppSetting | null>;
    getValue(key: string): Promise<string | null>;
    getNumber(key: string, fallback?: number): Promise<number>;
    set(key: string, value: string): Promise<AppSetting>;
}
