import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
  Res,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import type { Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import {
  generateCsrfToken,
  generateCsrfSecret,
  SkipCsrf,
} from '../../common/guards/csrf.guard';
import {
  REFRESH_COOKIE,
  setRefreshCookie,
  clearRefreshCookie,
} from '../../common/refresh-cookie.util';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CompleteFirstLoginDto } from './dto/complete-first-login.dto';

@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('csrf-token')
  getCsrfToken(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    let secret: string | undefined = req.cookies?.['csrf-secret'];
    if (!secret) {
      secret = generateCsrfSecret();
      res.cookie('csrf-secret', secret, {
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
      });
    }
    return { token: generateCsrfToken(secret) };
  }

  @Post('register')
  @SkipCsrf()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!dto.email && !dto.phone) {
      throw new BadRequestException('Email or phone number is required');
    }
    const result = await this.authService.register(dto);
    if (result.refreshToken) {
      setRefreshCookie(res, result.refreshToken);
    }
    return result;
  }

  @Post('login')
  @SkipCsrf()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  async login(
    @Req() req: Request,
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ip = req.ip || req.socket?.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';
    const result = await this.authService.login(
      dto.emailOrPhone,
      dto.password,
      {
        ip,
        userAgent,
      },
    );
    if (result.refreshToken) {
      setRefreshCookie(res, result.refreshToken);
    }
    return result;
  }

  @Post('refresh')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Body() dto: { refreshToken?: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const cookieToken = (req.cookies as Record<string, string> | undefined)?.[
      REFRESH_COOKIE
    ];
    const refreshToken = cookieToken || dto?.refreshToken;
    if (!refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    const tokens = await this.authService.refreshTokens(refreshToken);
    setRefreshCookie(res, tokens.refreshToken);
    return tokens;
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @CurrentUser('sub') userId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(userId);
    clearRefreshCookie(res);
  }

  @Post('forgot-password')
  @SkipCsrf()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.emailOrPhone);
  }

  @Post('reset-password')
  @SkipCsrf()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(
      dto.emailOrPhone,
      dto.token,
      dto.newPassword,
    );
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser('sub') userId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    await this.authService.changePassword(
      userId,
      dto.currentPassword,
      dto.newPassword,
    );
    return { message: 'Password changed successfully' };
  }

  @Post('complete-first-login')
  @SkipCsrf()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  async completeFirstLogin(@Body() dto: CompleteFirstLoginDto) {
    return this.authService.completeFirstLogin(
      dto.emailOrPhone,
      dto.currentPassword,
      dto.newPassword,
    );
  }

  @Post('login-history')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async loginHistory(@CurrentUser('sub') userId: string) {
    return this.authService.getLoginHistory(userId);
  }
}
