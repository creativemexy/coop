import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { AccountsService } from '../services/accounts.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '../../../common/enums/role.enum';
import { AccountType } from '../../../common/enums/status.enum';

@Controller('api/v1/ledger/accounts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AccountsController {
  constructor(private readonly service: AccountsService) {}

  @Post()
  @Roles(Role.ACCOUNTANT, Role.SUPER_ADMIN)
  async create(
    @Body()
    dto: {
      code: string;
      name: string;
      type: AccountType;
      description?: string;
      organizationId?: string;
    },
  ) {
    return this.service.create(dto);
  }

  @Get()
  async findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Patch(':id')
  @Roles(Role.ACCOUNTANT, Role.SUPER_ADMIN)
  async update(
    @Param('id') id: string,
    @Body()
    dto: {
      code?: string;
      name?: string;
      type?: AccountType;
      description?: string;
      isActive?: boolean;
    },
  ) {
    return this.service.update(id, dto);
  }
}
