import { Controller, Get, Post, Req, Res, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { SkipCsrf } from '../../common/guards/csrf.guard';
import type { Request } from 'express';

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
    @Body() dto: { provider: 'google' | 'apple'; idToken: string; firstName?: string; lastName?: string },
  ) {
    const ip = req.ip || req.socket?.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';
    return this.authService.socialExchange(dto.provider, dto.idToken, {
      ip,
      userAgent,
      firstName: dto.firstName,
      lastName: dto.lastName,
    });
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: any, @Res() res: any) {
    const profile = req.user as {
      socialId: string;
      provider: string;
      email: string;
      firstName: string;
      lastName: string;
    };

    const result = await this.findOrCreateUser(profile);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    return res.redirect(
      `${frontendUrl}/auth/social-callback?token=${result.accessToken}&refreshToken=${result.refreshToken}`,
    );
  }

  @Get('apple')
  @UseGuards(AuthGuard('apple'))
  appleAuth() {}

  @Get('apple/callback')
  @UseGuards(AuthGuard('apple'))
  async appleCallback(@Req() req: any, @Res() res: any) {
    const profile = req.user as {
      socialId: string;
      provider: string;
      email: string;
      firstName: string;
      lastName: string;
    };

    const result = await this.findOrCreateUser(profile);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    return res.redirect(
      `${frontendUrl}/auth/social-callback?token=${result.accessToken}&refreshToken=${result.refreshToken}`,
    );
  }

  private async findOrCreateUser(profile: {
    socialId: string;
    provider: string;
    email: string;
    firstName: string;
    lastName: string;
  }) {
    let user = await this.usersService.findBySocial(profile.provider, profile.socialId);
    if (!user && profile.email) {
      user = await this.usersService.findByEmail(profile.email);
      if (user) {
        await this.usersService.updateUser(user.id, {
          socialProvider: profile.provider,
          socialId: profile.socialId,
        } as any);
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
