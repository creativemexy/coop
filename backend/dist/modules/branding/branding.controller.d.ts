import { SettingsService } from '../settings/settings.service';
export declare class BrandingController {
    private readonly settings;
    constructor(settings: SettingsService);
    get(): Promise<{
        organizationName: string;
        logoUrl: string | null;
        primaryColor: string;
        accentColor: string;
    }>;
    updateName(dto: {
        name: string;
    }): Promise<{
        organizationName: string;
    }>;
    updateColors(dto: {
        primaryColor: string;
        accentColor: string;
    }): Promise<{
        primaryColor: string;
        accentColor: string;
    }>;
    uploadLogo(file: any): Promise<{
        logoUrl: string;
    }>;
}
