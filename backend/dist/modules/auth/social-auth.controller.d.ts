import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import type { Request } from 'express';
export declare class SocialAuthController {
    private readonly authService;
    private readonly usersService;
    constructor(authService: AuthService, usersService: UsersService);
    googleAuth(): void;
    socialExchange(req: Request, dto: {
        provider: 'google' | 'apple';
        idToken: string;
        firstName?: string;
        lastName?: string;
    }): Promise<{
        user: Partial<import("../users/entities/user.entity").User>;
        accessToken: string;
        refreshToken: string;
    }>;
    googleCallback(req: any, res: any): Promise<any>;
    appleAuth(): void;
    appleCallback(req: any, res: any): Promise<any>;
    private findOrCreateUser;
}
