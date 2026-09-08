import {
  Controller,
  Sse,
  Get,
  Param,
  UseGuards,
  Req,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Request } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RealtimeService } from './realtime.service';
import { SseAuthGuard } from './sse-auth.guard';
import { SupportTicket } from '../bnpl/entities/support-ticket.entity';

@Controller('api/v1/realtime')
@UseGuards(SseAuthGuard)
export class RealtimeController {
  constructor(
    private readonly realtime: RealtimeService,
    @InjectRepository(SupportTicket)
    private readonly ticketRepo: Repository<SupportTicket>,
  ) {}

  @Sse('support/tickets/stream')
  async streamSupportTickets(@Req() req: Request & { user: any }) {
    const { role } = req.user;
    if (role !== 'super_admin' && role !== 'customer_care') {
      throw new ForbiddenException('Access denied');
    }
    return this.realtime.streamAll();
  }

  @Sse('individual/tickets/stream')
  async streamIndividualTickets(@Req() req: Request & { user: any }) {
    const { sub, role } = req.user;
    if (role !== 'individual') throw new ForbiddenException('Access denied');
    return this.realtime.streamForUser(sub);
  }

  @Sse('support/tickets/:id/stream')
  async streamSupportTicket(
    @Param('id') id: string,
    @Req() req: Request & { user: any },
  ) {
    const { role } = req.user;
    if (role !== 'super_admin' && role !== 'customer_care') {
      throw new ForbiddenException('Access denied');
    }
    const ticket = await this.ticketRepo.findOne({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket not found');
    return this.realtime.stream(id);
  }

  @Sse('individual/tickets/:id/stream')
  async streamIndividualTicket(
    @Param('id') id: string,
    @Req() req: Request & { user: any },
  ) {
    const { sub, role } = req.user;
    if (role !== 'individual') throw new ForbiddenException('Access denied');
    const ticket = await this.ticketRepo.findOne({ where: { id, createdBy: sub } });
    if (!ticket) throw new NotFoundException('Ticket not found');
    return this.realtime.stream(id);
  }
}
