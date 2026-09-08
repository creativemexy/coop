import { Module } from '@nestjs/common';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { SocialAuthController } from './social-auth.controller';
import { RegistrationsController } from './registrations.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { User } from '../users/entities/user.entity';
import { ApexOrganization } from '../apex-organizations/entities/apex-organization.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { LoginHistory } from './entities/login-history.entity';
import { DeviceSession } from './entities/device-session.entity';
import { DeviceSessionService } from './device-session.service';
import { UsersModule } from '../users/users.module';
import { RetentionModule } from '../../common/retention.module';
import { FirstVirtualModule } from '../first-virtual/first-virtual.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      ApexOrganization,
      Organization,
      LoginHistory,
      DeviceSession,
    ]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): JwtModuleOptions => ({
        secret:
          configService.get<string>('jwt.accessSecret') || 'default-access-secret',
        signOptions: {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          expiresIn: (configService.get<string>('jwt.accessExpiry') ||
            '15m') as any,
        },
      }),
    }),
    UsersModule,
    RetentionModule,
    FirstVirtualModule,
    NotificationsModule,
  ],
  controllers: [AuthController, SocialAuthController, RegistrationsController],
  providers: [AuthService, DeviceSessionService, JwtStrategy, GoogleStrategy],
  exports: [AuthService, JwtModule, PassportModule],
})
export class AuthModule {}
