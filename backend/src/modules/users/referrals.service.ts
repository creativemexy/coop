import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Referral, ReferralStatus } from './entities/referral.entity';
import { User } from './entities/user.entity';

@Injectable()
export class ReferralsService {
  constructor(
    @InjectRepository(Referral)
    private readonly referralRepo: Repository<Referral>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async getReferrals(userId: string) {
    const [sent, received] = await Promise.all([
      this.referralRepo.find({ where: { referrerId: userId }, order: { createdAt: 'DESC' } }),
      this.referralRepo.find({ where: { refereeId: userId }, order: { createdAt: 'DESC' } }),
    ]);
    return { sent, received };
  }

  async createReferral(referrerId: string, refereeEmail: string) {
    const referrer = await this.userRepo.findOne({ where: { id: referrerId } });
    if (!referrer) throw new BadRequestException('Referrer not found');

    const existing = await this.referralRepo.findOne({
      where: { referrerId, refereeEmail },
    });
    if (existing) throw new BadRequestException('Referral already sent to this email');

    const code = referrer.referralCode || 'COOP' + Math.random().toString(36).substring(2, 8).toUpperCase();
    if (!referrer.referralCode) {
      await this.userRepo.update(referrerId, { referralCode: code });
    }

    const referral = this.referralRepo.create({
      referrerId,
      refereeEmail,
      referralCode: code,
    });
    return this.referralRepo.save(referral);
  }
}
