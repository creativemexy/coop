import {
  Controller,
  Get,
  Post,
  Req,
  Res,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { SkipCsrf } from '../../common/guards/csrf.guard';
import { setRefreshCookie } from '../../common/refresh-cookie.util';
import type { Request, Response } from 'express';

type SocialProfile = {
  socialId: string;
  provider: string;
  email: string;
  firstName: string;
  lastName: string;
};

@Controller('api/v1/auth')
export class SocialAuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth() {}

  @Post('social/exchange')
  @SkipCsrf()
  @HttpCode(HttpStatus.OK)
  async socialExchange(
    @Req() req: Request,
    @Body()
    dto: {
      provider: 'google' | 'apple';
      idToken: string;
      firstName?: string;
      lastName?: string;
    },
    @Res({ passthrough: true }) res: Response,
  ) {
    const ip = req.ip || req.socket?.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';
    const result = await this.authService.socialExchange(
      dto.provider,
      dto.idToken,
      {
        ip,
        userAgent,
        firstName: dto.firstName,
        lastName: dto.lastName,
      },
    );
    if (result.refreshToken) {
      setRefreshCookie(res, result.refreshToken);
    }
    return result;
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const profile = (req as unknown as { user: SocialProfile }).user;

    const { refreshToken } = await this.findOrCreateUser(profile);
    setRefreshCookie(res, refreshToken);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    // Security: the session is delivered exclusively via the HttpOnly cookie,
    // never via redirect query params (which leak tokens into browser history,
    // server logs, and Referer headers). The client then restores its session
    // with the cookie-backed refresh flow.
    return res.redirect(`${frontendUrl}/auth/social-callback`);
  }

  @Get('apple')
  @UseGuards(AuthGuard('apple'))
  appleAuth() {}

  @Get('apple/callback')
  @UseGuards(AuthGuard('apple'))
  async appleCallback(@Req() req: Request, @Res() res: Response) {
    const profile = (req as unknown as { user: SocialProfile }).user;

    const { refreshToken } = await this.findOrCreateUser(profile);
    setRefreshCookie(res, refreshToken);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    return res.redirect(`${frontendUrl}/auth/social-callback`);
  }

  private async findOrCreateUser(profile: {
    socialId: string;
    provider: string;
    email: string;
    firstName: string;
    lastName: string;
  }) {
    let user = await this.usersService.findBySocial(
      profile.provider,
      profile.socialId,
    );
    if (!user && profile.email) {
      user = await this.usersService.findByEmail(profile.email);
      if (user) {
        await this.usersService.updateUser(user.id, {
          socialProvider: profile.provider,
          socialId: profile.socialId,
        });
      }
    }
    if (!user) {
      user = await this.usersService.createSocialUser({
        email: profile.email,
        firstName: profile.firstName || 'User',
        lastName: profile.lastName || '',
        socialProvider: profile.provider,
        socialId: profile.socialId,
      });
    }

    const tokens = await this.authService.generateTokens(user);
    await this.authService.updateRefreshTokenHash(user.id, tokens.refreshToken);

    return tokens;
  }
}
