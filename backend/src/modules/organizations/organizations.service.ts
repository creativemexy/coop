import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Organization } from './entities/organization.entity';
import { OrgStatus } from '../../common/enums/status.enum';
import { User } from '../users/entities/user.entity';
import { Role } from '../../common/enums/role.enum';
import { EmailService } from '../email/email.service';
import { SmsService } from '../sms/sms.service';
import { PaystackClient } from '../payments/providers/paystack/paystack.client';
import { maskEmail } from '../../common/mask.util';
import { hashForLookup } from '../../common/encryption.service';
import {
  generateTemporaryPassword,
  normalizePhoneForSms,
} from '../../common/temp-password.util';

@Injectable()
export class OrganizationsService {
  private readonly logger = new Logger(OrganizationsService.name);

  constructor(
    @InjectRepository(Organization)
    private readonly repo: Repository<Organization>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
    private readonly paystackClient: PaystackClient,
  ) {}

  async resolveBankAccount(accountNumber: string, bankCode: string) {
    if (!accountNumber || !bankCode) {
      throw new BadRequestException('accountNumber and bankCode are required');
    }
    const result = await this.paystackClient.resolveBankAccount(accountNumber, bankCode);
    if (!result) {
      return { resolved: false, message: 'Bank account resolution is not configured' };
    }
    return { resolved: true, accountName: result.accountName, accountNumber: result.accountNumber };
  }

  private generateCode(name: string): string {
    const cleaned = name.replace(/[^a-zA-Z0-9 ]/g, '').trim();
    const words = cleaned.split(/\s+/);
    let code: string;

    if (words.length === 1) {
      code = words[0].substring(0, 6).toUpperCase();
    } else {
      code = words.map((w) => w[0]).join('').substring(0, 5).toUpperCase();
    }

    const suffix = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    code = `${code}${suffix}`;

    return code;
  }

  private async ensureUniqueCode(base: string): Promise<string> {
    let code = base;
    let attempts = 0;
    while (await this.repo.findOne({ where: { code } })) {
      attempts++;
      const suffix = Math.floor(Math.random() * 9999)
        .toString()
        .padStart(4, '0');
      code = `${base.substring(0, 4)}${suffix}`;
      if (attempts > 50) {
        code = `ORG${Date.now().toString(36).toUpperCase()}`;
        break;
      }
    }
    return code;
  }

  async create(dto: {
    name: string;
    apexOrgId: string;
    createdBy: string;
    address?: string;
    contactEmail?: string;
    contactPhone?: string;
    contactPersonName?: string;
    contactPersonPhone?: string;
    contactPersonEmail?: string;
    bankName?: string;
    accountName?: string;
    accountNumber?: string;
    sortCode?: string;
    bankCode?: string;
  }): Promise<Organization & { generatedEmail?: string; generatedPassword?: string }> {
    const code = await this.ensureUniqueCode(this.generateCode(dto.name));

    const org = this.repo.create({
      name: dto.name,
      code,
      apexOrgId: dto.apexOrgId,
      createdBy: dto.createdBy,
      status: OrgStatus.ACTIVE,
      address: dto.address,
      contactEmail: dto.contactEmail,
      contactPhone: dto.contactPhone,
      contactPersonName: dto.contactPersonName,
      contactPersonPhone: dto.contactPersonPhone,
      contactPersonEmail: dto.contactPersonEmail,
      bankName: dto.bankName,
      accountName: dto.accountName,
      accountNumber: dto.accountNumber,
      sortCode: dto.sortCode,
      bankCode: dto.bankCode,
    });
    const saved = await this.repo.save(org);

    // Create business manager user for this org
    const slug = code.toLowerCase().replace(/[^a-z0-9]/g, '');
    const email = `bm-${slug}@coop.com`;
    const password = generateTemporaryPassword();
    const passwordHash = await bcrypt.hash(password, 10);
    const phone = dto.contactPhone || dto.contactPersonPhone || '08000000001';

    const bmUser = this.userRepo.create({
      email,
      emailHash: hashForLookup(email),
      passwordHash,
      firstName: 'Business',
      lastName: `Manager - ${dto.name}`,
      phone,
      phoneHash: hashForLookup(phone),
      role: Role.BUSINESS_MANAGER,
      organizationId: saved.id,
      apexOrgId: dto.apexOrgId,
      isActive: true,
      mustChangePassword: true,
    });
    await this.userRepo.save(bmUser);

    // Send email with login details
    const recipientEmail = dto.contactPersonEmail || dto.contactEmail || email;
    await this.emailService.send({
      to: recipientEmail,
      subject: `Organization Created — ${dto.name}`,
      text: [
        `Dear ${dto.contactPersonName || 'Business Manager'},`,
        '',
        `Your organization "${dto.name}" has been created successfully.`,
        '',
        `Organization Code: ${code}`,
        '',
        `Business Manager Login Credentials:`,
        `Email: ${email}`,
        `Temporary Password: ${password}`,
        '',
        `Please log in at the platform dashboard. You will be required to change this password on first login.`,
        '',
        'Regards,',
        'Coop BNPL Team',
      ].join('\n'),
    });

    // Send SMS with login details to the provided phone number
    await this.smsService.send(
      normalizePhoneForSms(phone),
      [
        `Your organization "${dto.name}" (code ${code}) has been created.`,
        `Login: ${email}`,
        `Temporary password: ${password}`,
        'Change it on first login. - Coop BNPL',
      ].join('\n'),
      'organization_created',
    );

    this.logger.log(`Org created: ${code}, BM user: ${maskEmail(email)}`);

    return { ...saved, generatedEmail: email, generatedPassword: password } as any;
  }

  async findAll(apexOrgId?: string): Promise<Organization[]> {
    const where: Record<string, unknown> = {};
    if (apexOrgId) where.apexOrgId = apexOrgId;
    return this.repo.find({ where, relations: { apexOrg: true }, order: { createdAt: 'DESC' } });
  }

  async findById(id: string): Promise<Organization> {
    const org = await this.repo.findOne({
      where: { id },
      relations: { apexOrg: true },
    });
    if (!org) {
      throw new NotFoundException('Organization not found');
    }
    return org;
  }

  async update(
    id: string,
    dto: {
      name?: string;
      status?: OrgStatus;
      address?: string;
      contactEmail?: string;
      contactPhone?: string;
      contactPersonName?: string;
      contactPersonPhone?: string;
      contactPersonEmail?: string;
      bankName?: string;
      accountName?: string;
      accountNumber?: string;
      sortCode?: string;
      bankCode?: string;
    },
  ): Promise<Organization> {
    await this.repo.update(id, dto);
    return this.findById(id);
  }
}
