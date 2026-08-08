import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Res,
  Req,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';

import { KycService } from './kyc.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';
import { KycStatus } from '../../common/enums/status.enum';
import { KorapayIdentityType } from './korapay/korapay.types';

@Controller('api/v1/kyc')
export class KycController {
  constructor(private readonly service: KycService) {}

  @Post('initiate')
  @UseGuards(JwtAuthGuard)
  async initiate(
    @CurrentUser('sub') userId: string,
    @Body() body: { id: string; type?: KorapayIdentityType },
  ) {
    return this.service.initiate(userId, body.id, body.type);
  }

  @Post('webhook')
  async webhook(
    @Req() req: any,
    @Headers('x-korapay-signature') signature: string,
  ) {
    const rawBody = req.rawBody;
    if (!this.service.verifyWebhookSignature(rawBody, signature)) {
      throw new UnauthorizedException('Invalid webhook signature');
    }
    await this.service.handleWebhook(req.body);
    return { status: 'processed' };
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  async getStatus(@CurrentUser('sub') userId: string) {
    return this.service.getStatus(userId);
  }

  @Get('submissions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.BUSINESS_MANAGER, Role.BNPL_MANAGER, Role.SUPER_ADMIN, Role.OPERATIONAL_ADMIN, Role.OPERATIONAL_ADMIN)
  async listSubmissions(
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.service.listSubmissions({ status, search });
  }

  @Patch('submissions/:id/review')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.BUSINESS_MANAGER, Role.BNPL_MANAGER, Role.SUPER_ADMIN, Role.OPERATIONAL_ADMIN, Role.OPERATIONAL_ADMIN)
  async reviewSubmission(
    @Param('id') id: string,
    @Body() dto: { status: KycStatus; rejectionReason?: string },
  ) {
    return this.service.reviewSubmission(id, dto);
  }

  @Get('export')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.BUSINESS_MANAGER, Role.BNPL_MANAGER, Role.SUPER_ADMIN)
  async export(@Res() res: any) {
    const submissions = await this.service.listSubmissions();
    const header = 'ID,User ID,Provider,Reference,Status,Rejection Reason,Submitted At,Processed At\n';
    const rows = submissions
      .map(
        (s) =>
          `${s.id},${s.userId},${s.provider},${s.reference},${s.status},${s.rejectionReason || ''},${s.submittedAt?.toISOString() || ''},${s.processedAt?.toISOString() || ''}`,
      )
      .join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="kyc-submissions.csv"');
    res.send(header + rows);
  }
}
