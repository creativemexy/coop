import {
  Controller,
  Delete,
  Get,
  Post,
  Param,
  Patch,
  Body,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { ReferralsService } from './referrals.service';
import { UserActivityService } from './user-activity.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { KycStatus } from '../../common/enums/status.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { maskUser } from '../../common/mask.util';

@Controller('api/v1/users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly referralsService: ReferralsService,
    private readonly activityService: UserActivityService,
  ) {}

  @Get('me')
  async getMe(@CurrentUser('sub') userId: string) {
    return this.usersService.findById(userId);
  }

  @Patch('me')
  @HttpCode(HttpStatus.OK)
  async updateMe(
    @CurrentUser('sub') userId: string,
    @Body()
    updates: { firstName?: string; lastName?: string; phone?: string; notificationPreferences?: { email?: boolean; sms?: boolean; inApp?: boolean } },
  ) {
    const user = await this.usersService.findById(userId);
    const identityUpdated =
      'firstName' in updates || 'lastName' in updates || 'phone' in updates;
    if (identityUpdated && user.kycStatus === KycStatus.APPROVED) {
      throw new ForbiddenException(
        'Identity details are locked after KYC verification completes. Contact support to change them.',
      );
    }
    return this.usersService.updateUser(userId, updates);
  }

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.OPERATIONAL_ADMIN, Role.OPERATIONAL_ADMIN, Role.BUSINESS_MANAGER)
  async listUsers(
    @Query('role') role?: Role,
    @Query('organizationId') organizationId?: string,
    @Query('kycStatus') kycStatus?: string,
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
    @CurrentUser() user?: any,
  ) {
    if (user?.role === Role.BUSINESS_MANAGER) {
      organizationId = user.organizationId;
      role = Role.INDIVIDUAL;
    }
    const users = await this.usersService.listUsers(role, organizationId, undefined, {
      kycStatus,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      search,
    });
    return users.map((u) => maskUser(u, user?.role));
  }

  @Get(':id')
  async getUser(@Param('id') id: string, @CurrentUser() user?: any) {
    if (user?.role === Role.INDIVIDUAL && user?.sub !== id) {
      throw new ForbiddenException('You can only access your own data');
    }
    const target = await this.usersService.findById(id);
    if (user?.sub === id) return target;
    return maskUser(target, user?.role);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.OPERATIONAL_ADMIN, Role.OPERATIONAL_ADMIN, Role.BUSINESS_MANAGER)
  async updateUser(
    @Param('id') id: string,
    @Body()
    updates: {
      role?: Role;
      isActive?: boolean;
      firstName?: string;
      lastName?: string;
      kycStatus?: KycStatus;
    },
  ) {
    return this.usersService.updateUser(id, updates);
  }

  @Delete('me')
  @HttpCode(HttpStatus.OK)
  async deleteAccount(@CurrentUser('sub') userId: string) {
    return this.usersService.deleteAccount(userId);
  }

  @Get('me/export')
  async exportData(@CurrentUser('sub') userId: string) {
    return this.usersService.exportData(userId);
  }

  @Get('me/referral-code')
  async getReferralCode(@CurrentUser('sub') userId: string) {
    const code = await this.usersService.generateReferralCode(userId);
    return { referralCode: code };
  }

  @Get('me/referral-stats')
  async getReferralStats(@CurrentUser('sub') userId: string) {
    return this.usersService.getReferralStats(userId);
  }

  @Get('me/referrals')
  async getMyReferrals(@CurrentUser('sub') userId: string) {
    return this.referralsService.getReferrals(userId);
  }

  @Post('me/referrals')
  @HttpCode(HttpStatus.CREATED)
  async createReferral(
    @CurrentUser('sub') userId: string,
    @Body() dto: { refereeEmail: string },
  ) {
    const result = await this.referralsService.createReferral(userId, dto.refereeEmail);
    await this.activityService.log(userId, 'sent_referral', { refereeEmail: dto.refereeEmail });
    return result;
  }

  @Get('me/activity')
  async getActivity(
    @CurrentUser('sub') userId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.activityService.findByUser(userId, limit ? Number(limit) : 50, offset ? Number(offset) : 0);
  }
}
