import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApprovalService } from '../services/approval.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Role } from '../../../common/enums/role.enum';
import { ApprovalRequestType } from '../entities/approval-request.entity';

@Controller('api/v1/bnpl/approvals')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ApprovalController {
  constructor(private readonly service: ApprovalService) {}

  @Post()
  @Roles(Role.BUSINESS_MANAGER, Role.BNPL_MANAGER, Role.OPERATIONAL_ADMIN, Role.SUPER_ADMIN)
  async submit(
    @Body()
    dto: {
      requestType: ApprovalRequestType;
      requestData: Record<string, any>;
      reason?: string;
    },
    @CurrentUser('sub') userId: string,
  ) {
    return this.service.submit({ ...dto, requestedBy: userId });
  }

  @Get()
  @Roles(Role.BUSINESS_MANAGER, Role.BNPL_MANAGER, Role.OPERATIONAL_ADMIN, Role.SUPER_ADMIN)
  async list(
    @Query('status') status?: string,
    @Query('requestType') requestType?: string,
  ) {
    return this.service.list({ status, requestType });
  }

  @Get(':id')
  @Roles(Role.BUSINESS_MANAGER, Role.BNPL_MANAGER, Role.SUPER_ADMIN)
  async findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Patch(':id/approve')
  @Roles(Role.BUSINESS_MANAGER, Role.BNPL_MANAGER, Role.SUPER_ADMIN)
  async approve(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.service.approve(id, userId, role);
  }

  @Patch(':id/reject')
  @Roles(Role.BUSINESS_MANAGER, Role.BNPL_MANAGER, Role.SUPER_ADMIN)
  async reject(
    @Param('id') id: string,
    @Body() dto: { rejectionReason?: string },
    @CurrentUser('sub') userId: string,
  ) {
    return this.service.reject(id, userId, dto.rejectionReason);
  }
}