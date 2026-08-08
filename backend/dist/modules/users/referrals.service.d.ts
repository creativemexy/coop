import { Repository } from 'typeorm';
import { Referral } from './entities/referral.entity';
import { User } from './entities/user.entity';
export declare class ReferralsService {
    private readonly referralRepo;
    private readonly userRepo;
    constructor(referralRepo: Repository<Referral>, userRepo: Repository<User>);
    getReferrals(userId: string): Promise<{
        sent: Referral[];
        received: Referral[];
    }>;
    createReferral(referrerId: string, refereeEmail: string): Promise<Referral>;
}
