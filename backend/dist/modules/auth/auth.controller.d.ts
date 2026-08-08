import type { Response } from 'express';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CompleteFirstLoginDto } from './dto/complete-first-login.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    getCsrfToken(req: Request, res: Response): {
        token: string;
    };
    register(dto: RegisterDto): Promise<{
        registrationFeeRequired: boolean;
        registrationFeeAmount: number;
        pendingUserId?: string;
        user?: Partial<import("../users/entities/user.entity").User>;
        accessToken?: string;
        refreshToken?: string;
    }>;
    login(req: Request, dto: LoginDto): Promise<{
        user: Partial<import("../users/entities/user.entity").User>;
        accessToken: string;
        refreshToken: string;
        isNewDevice?: boolean;
        passwordChangeRequired?: boolean;
    }>;
    refresh(dto: {
        refreshToken: string;
    }): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    logout(userId: string): Promise<void>;
    forgotPassword(dto: ForgotPasswordDto): Promise<{
        message: string;
        token?: string;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    changePassword(userId: string, dto: ChangePasswordDto): Promise<{
        message: string;
    }>;
    completeFirstLogin(dto: CompleteFirstLoginDto): Promise<{
        message: string;
    }>;
    loginHistory(userId: string): Promise<import("./entities/login-history.entity").LoginHistory[]>;
}
