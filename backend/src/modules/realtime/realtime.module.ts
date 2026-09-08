import { Module } from '@nestjs/common';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RealtimeService } from './realtime.service';
import { RealtimeController } from './realtime.controller';
import { SseAuthGuard } from './sse-auth.guard';
import { User } from '../users/entities/user.entity';
import { SupportTicket } from '../bnpl/entities/support-ticket.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, SupportTicket]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): JwtModuleOptions => ({
        secret:
          configService.get<string>('jwt.accessSecret') || 'default-access-secret',
      }),
    }),
  ],
  controllers: [RealtimeController],
  providers: [RealtimeService, SseAuthGuard],
  exports: [RealtimeService],
})
export class RealtimeModule {}
