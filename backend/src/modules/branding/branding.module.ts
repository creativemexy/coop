import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { BrandingController } from './branding.controller';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [
    MulterModule.register({ dest: './uploads/branding' }),
    SettingsModule,
  ],
  controllers: [BrandingController],
})
export class BrandingModule {}
