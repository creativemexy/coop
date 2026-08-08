import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@Controller('api/v1/settings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SettingsController {
  constructor(private readonly service: SettingsService) {}

  @Get(':key')
  @Roles(Role.SUPER_ADMIN)
  async get(@Param('key') key: string) {
    const setting = await this.service.get(key);
    return setting ?? { key, value: null };
  }

  @Patch(':key')
  @Roles(Role.SUPER_ADMIN)
  async update(@Param('key') key: string, @Body() dto: { value: string }) {
    return this.service.set(key, dto.value);
  }
}
