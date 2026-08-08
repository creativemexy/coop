import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { JournalService } from '../services/journal.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Role } from '../../../common/enums/role.enum';

const PLATFORM_ROLES = [Role.ACCOUNTANT, Role.SUPER_ADMIN];

@Controller('api/v1/ledger/journal-entries')
@UseGuards(JwtAuthGuard, RolesGuard)
export class JournalController {
  constructor(private readonly service: JournalService) {}

  @Post()
  @Roles(Role.ACCOUNTANT, Role.SUPER_ADMIN, Role.BNPL_MANAGER, Role.BUSINESS_MANAGER)
  async postEntry(
    @Body()
    dto: {
      description: string;
      entryDate: string;
      lines: Array<{
        accountId: string;
        debit: number;
        credit: number;
        organizationId?: string;
      }>;
    },
    @CurrentUser() user: any,
  ) {
    const isPlatform = PLATFORM_ROLES.includes(user.role);
    const lines = dto.lines.map((l) => ({
      ...l,
      organizationId: isPlatform ? l.organizationId : (l.organizationId || user.organizationId),
    }));
    return this.service.postEntry({
      ...dto,
      lines,
      entryDate: new Date(dto.entryDate),
      postedBy: user.sub,
    });
  }

  @Get()
  async findEntries(@CurrentUser() user: any) {
    const isPlatform = PLATFORM_ROLES.includes(user.role);
    return this.service.findEntries(isPlatform ? undefined : user.organizationId);
  }
}
