import { OnApplicationBootstrap } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from './modules/users/entities/user.entity';
export declare class BootstrapAdminService implements OnApplicationBootstrap {
    private readonly userRepo;
    private readonly logger;
    constructor(userRepo: Repository<User>);
    onApplicationBootstrap(): Promise<void>;
    private ensureSuperAdmin;
}
