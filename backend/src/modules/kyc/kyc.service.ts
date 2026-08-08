import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KycSubmission } from './entities/kyc-submission.entity';
import { KycStatus, KycProvider } from '../../common/enums/status.enum';
import { UsersService } from '../users/users.service';
import { KorapayClient } from './korapay/korapay.client';
import { KorapayIdentityType, KorapayLookupData } from './korapay/korapay.types';
import { NotificationsService } from '../notifications/notifications.service';

const KYC_EXPIRY_MS = 365 * 24 * 60 * 60 * 1000;

@Injectable()
export class KycService {
  private readonly logger = new Logger(KycService.name);

  constructor(
    @InjectRepository(KycSubmission)
    private readonly repo: Repository<KycSubmission>,
    private readonly usersService: UsersService,
    private readonly korapayClient: KorapayClient,
    private readonly notifications: NotificationsService,
  ) {}

  static isKycExpired(kycVerifiedAt: Date | null | undefined): boolean {
    if (!kycVerifiedAt) return true;
    return Date.now() - kycVerifiedAt.getTime() > KYC_EXPIRY_MS;
  }

  verifyWebhookSignature(rawBody: string, signature: string): boolean {
    return this.korapayClient.verifyWebhookSignature(rawBody, signature);
  }

  private normalize(str: string | null | undefined): string {
    return (str ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
  }

  private matchField(userVal: string | null | undefined, korapayVal: string | null | undefined): boolean {
    if (!userVal || !korapayVal) return false;
    return this.normalize(userVal) === this.normalize(korapayVal);
  }

  async initiate(
    userId: string,
    id: string,
    identityType?: KorapayIdentityType,
  ): Promise<{ status: KycStatus; reference: string; match?: any; korapayData?: any }> {
    const user = await this.usersService.findById(userId);
    if (user.kycStatus === KycStatus.APPROVED && !KycService.isKycExpired(user.kycVerifiedAt)) {
      throw new BadRequestException('KYC already approved');
    }

    const reference = `KYC-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    try {
      const result = await this.korapayClient.verifyIdentity({
        id,
        type: identityType || 'bvn',
        reference,
      });

      const firstNameMatch = this.matchField(user.firstName, result.first_name);
      const lastNameMatch = this.matchField(user.lastName, result.last_name);

      let emailMatch: boolean | null = null;
      if (user.email) {
        emailMatch = this.matchField(user.email, result.email);
      }

      let phoneMatch: boolean | null = null;
      if (user.phone) {
        const userPhone = user.phone.replace(/\D/g, '');
        const resultPhone = (result.phone_number || '').replace(/\D/g, '');
        phoneMatch = resultPhone.length > 0 && (resultPhone.includes(userPhone) || userPhone.includes(resultPhone));
      }

      const match = {
        firstName: { user: user.firstName, korapay: result.first_name, match: firstNameMatch },
        lastName: { user: user.lastName, korapay: result.last_name, match: lastNameMatch },
        email: user.email ? { user: user.email, korapay: result.email, match: emailMatch } : null,
        phone: user.phone ? { user: user.phone, korapay: result.phone_number, match: phoneMatch } : null,
      };

      const kycImage = result.image || null;

      const submission = this.repo.create({
        userId,
        provider: KycProvider.KORAPAY,
        identityType: identityType || 'bvn',
        reference,
        status: KycStatus.PENDING,
        submittedAt: new Date(),
        providerResponse: { korapayData: result, userData: { firstName: user.firstName, lastName: user.lastName, phone: user.phone }, match },
      });
      await this.repo.save(submission);

      await this.usersService.updateUser(userId, {
        kycReference: reference,
        kycStatus: KycStatus.PENDING,
        kycImage,
      });

      await this.notifications.create({
        userId,
        title: 'KYC Verification Submitted',
        message: `Your ${identityType || 'BVN'} verification has been submitted for review.`,
        type: 'info' as any,
        link: '/individual/kyc',
      });

      this.logger.log(`KYC initiated for user ${userId}, type: ${identityType || 'bvn'}, reference: ${reference}`);

      return { status: KycStatus.PENDING, reference, match, korapayData: result };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      const submission = this.repo.create({
        userId,
        provider: KycProvider.KORAPAY,
        identityType: identityType || 'bvn',
        reference,
        status: KycStatus.REJECTED,
        processedAt: new Date(),
        rejectionReason: errorMessage,
        providerResponse: { error: errorMessage },
        submittedAt: new Date(),
      });
      await this.repo.save(submission);

      await this.usersService.updateUser(userId, {
        kycReference: reference,
        kycStatus: KycStatus.REJECTED,
        kycVerifiedAt: null,
      });

      this.logger.warn(`KYC submission failed for user ${userId}: ${errorMessage}`);

      return { status: KycStatus.REJECTED, reference };
    }
  }

  async handleWebhook(payload: Record<string, unknown>): Promise<void> {
    const parsed = this.korapayClient.parseWebhookPayload(payload);
    if (!parsed) return;

    const submission = await this.repo.findOne({
      where: { reference: parsed.data.reference },
    });
    if (!submission) return;

    if (parsed.data.type) {
      submission.identityType = parsed.data.type;
    }

    const kycStatus =
      parsed.data.status === 'success' ? KycStatus.APPROVED : KycStatus.REJECTED;
    submission.status = kycStatus;
    submission.processedAt = new Date();
    submission.providerResponse = payload;
    await this.repo.save(submission);

    await this.usersService.updateUser(submission.userId, {
      kycStatus,
      kycVerifiedAt: kycStatus === KycStatus.APPROVED ? new Date() : undefined,
    });
  }

  async getStatus(userId: string): Promise<{
    kycStatus: KycStatus;
    lastSubmission: KycSubmission | null;
  }> {
    const user = await this.usersService.findById(userId);
    const lastSubmission = await this.repo.findOne({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    return {
      kycStatus: user.kycStatus,
      lastSubmission,
    };
  }

  async listSubmissions(filters?: {
    status?: string;
    search?: string;
  }): Promise<KycSubmission[]> {
    const qb = this.repo.createQueryBuilder('k');
    if (filters?.status) {
      qb.andWhere('k.status = :status', { status: filters.status });
    }
    if (filters?.search) {
      qb.andWhere(
        'k.reference ILIKE :search OR k.user_id::text ILIKE :search',
        { search: `%${filters.search}%` },
      );
    }
    qb.orderBy('k.submitted_at', 'DESC');
    return qb.getMany();
  }

  async reviewSubmission(
    id: string,
    dto: { status: KycStatus; rejectionReason?: string },
  ): Promise<KycSubmission> {
    const submission = await this.repo.findOne({ where: { id } });
    if (!submission) {
      throw new BadRequestException('Submission not found');
    }
    if (submission.status !== KycStatus.PENDING) {
      throw new BadRequestException('Submission already processed');
    }

    submission.status = dto.status;
    submission.processedAt = new Date();
    if (dto.rejectionReason) {
      submission.rejectionReason = dto.rejectionReason;
    }
    await this.repo.save(submission);

    await this.usersService.updateUser(submission.userId, {
      kycStatus: dto.status,
      kycVerifiedAt: dto.status === KycStatus.APPROVED ? new Date() : undefined,
    });

    const isApproved = dto.status === KycStatus.APPROVED;
    await this.notifications.create({
      userId: submission.userId,
      title: isApproved ? 'KYC Verification Approved' : 'KYC Verification Rejected',
      message: isApproved
        ? 'Your identity has been verified successfully.'
        : `Your KYC verification was rejected.${dto.rejectionReason ? ` Reason: ${dto.rejectionReason}` : ''}`,
      type: isApproved ? 'success' as any : 'error' as any,
      link: '/individual/kyc',
    });

    return submission;
  }
}
