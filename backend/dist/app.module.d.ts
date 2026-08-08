import { OnModuleInit } from '@nestjs/common';
import { EncryptionService } from './common/encryption.service';
export declare class AppModule implements OnModuleInit {
    private readonly encryption;
    constructor(encryption: EncryptionService);
    onModuleInit(): void;
}
