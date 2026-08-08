import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Role } from '../../common/enums/role.enum';
import { OrgStatus } from '../../common/enums/status.enum';
import { User } from '../../modules/users/entities/user.entity';
import { ApexOrganization } from '../../modules/apex-organizations/entities/apex-organization.entity';
import { Organization } from '../../modules/organizations/entities/organization.entity';
import { DeepPartial } from 'typeorm';
import { hashForLookup } from '../../common/encryption.service';

export async function seedDemoData(dataSource: DataSource): Promise<void> {
  const userRepo = dataSource.getRepository(User);
  const apexRepo = dataSource.getRepository(ApexOrganization);
  const orgRepo = dataSource.getRepository(Organization);

  // Create demo apex org
  let apexOrg = await apexRepo.findOne({ where: { code: 'APEX001' } });
  if (!apexOrg) {
    apexOrg = await apexRepo.save({
      name: 'Demo Apex Cooperative',
      code: 'APEX001',
      status: OrgStatus.ACTIVE,
    });
    console.log('Demo apex org created: APEX001');
  }

  // Create demo org under apex
  let org = await orgRepo.findOne({ where: { code: 'ORG001' } });
  if (!org) {
    org = await orgRepo.save({
      name: 'Demo Organization',
      code: 'ORG001',
      apexOrgId: apexOrg.id,
      status: OrgStatus.ACTIVE,
      address: '42 Awolowo Road, Ikoyi, Lagos',
      contactEmail: 'demo@org001.ng',
      contactPhone: '+2348010000001',
      contactPersonName: 'Tunde Bakare',
      contactPersonEmail: 'tunde@org001.ng',
      contactPersonPhone: '+2348020000001',
    });
    console.log('Demo org created: ORG001');
  }

  // Create demo admin (apex admin)
  const adminPassword = await bcrypt.hash('Admin@123456', 10);
  const adminExists = await userRepo.findOne({
    where: { emailHash: hashForLookup('admin@demo.com') },
  });
  if (!adminExists) {
    await userRepo.save({
      email: 'admin@demo.com',
      emailHash: hashForLookup('admin@demo.com'),
      passwordHash: adminPassword,
      firstName: 'Demo',
      lastName: 'Admin',
      phone: '08000000002',
      role: Role.OPERATIONAL_ADMIN,
      apexOrgId: apexOrg.id,
      isActive: true,
    });
    console.log('Demo admin seeded: admin@demo.com / Admin@123456');
  }

  // Create demo individual
  const individualPassword = await bcrypt.hash('User@123456', 10);
  const individualExists = await userRepo.findOne({
    where: { emailHash: hashForLookup('user@demo.com') },
  });
  if (!individualExists) {
    await userRepo.save({
      email: 'user@demo.com',
      emailHash: hashForLookup('user@demo.com'),
      passwordHash: individualPassword,
      firstName: 'Demo',
      lastName: 'User',
      phone: '08000000003',
      phoneHash: hashForLookup('08000000003'),
      role: Role.INDIVIDUAL,
      apexOrgId: apexOrg.id,
      organizationId: org.id,
      isActive: true,
    });
    console.log('Demo individual seeded: user@demo.com / User@123456');
  }

  // Create demo bnpl_manager
  const bnplManagerPassword = await bcrypt.hash('BNPL@123456', 10);
  const bnplManagerExists = await userRepo.findOne({
    where: { emailHash: hashForLookup('bnpl@demo.com') },
  });
  if (!bnplManagerExists) {
    await userRepo.save({
      email: 'bnpl@demo.com',
      emailHash: hashForLookup('bnpl@demo.com'),
      passwordHash: bnplManagerPassword,
      firstName: 'BNPL',
      lastName: 'Manager',
      phone: '08000000004',
      phoneHash: hashForLookup('08000000004'),
      role: Role.BNPL_MANAGER,
      apexOrgId: apexOrg.id,
      organizationId: org.id,
      isActive: true,
    });
    console.log('Demo BNPL manager seeded: bnpl@demo.com / BNPL@123456');
  }

  // Create demo accountant
  const accountantPassword = await bcrypt.hash('Acc@123456', 10);
  const accountantExists = await userRepo.findOne({
    where: { emailHash: hashForLookup('acc@demo.com') },
  });
  if (!accountantExists) {
    await userRepo.save({
      email: 'acc@demo.com',
      emailHash: hashForLookup('acc@demo.com'),
      passwordHash: accountantPassword,
      firstName: 'Demo',
      lastName: 'Accountant',
      phone: '08000000005',
      phoneHash: hashForLookup('08000000005'),
      role: Role.ACCOUNTANT,
      apexOrgId: apexOrg.id,
      organizationId: org.id,
      isActive: true,
    });
    console.log('Demo accountant seeded: acc@demo.com / Acc@123456');
  }

  // ---- Additional apex orgs with orgs ----

  const apexOrgs = [
    { name: 'Lagos State Cooperative', code: 'APEX002' },
    { name: 'Federal Employees Alliance', code: 'APEX003' },
    { name: 'Tech Workers Cooperative', code: 'APEX004' },
  ];

  for (const a of apexOrgs) {
    let existing = await apexRepo.findOne({ where: { code: a.code } });
    if (!existing) {
      existing = await apexRepo.save({ ...a, status: OrgStatus.ACTIVE });
      console.log(`Apex org created: ${a.code}`);
    }

    const orgsUnder = orgsByApex[a.code] ?? [];
    for (const o of orgsUnder) {
      const existingOrg = await orgRepo.findOne({ where: { code: o.code } });
      if (!existingOrg) {
        await orgRepo.save({ ...o, apexOrgId: existing.id, status: OrgStatus.ACTIVE });
        console.log(`Org created: ${o.code}`);
      }
    }
  }

  console.log('Demo data seeded successfully');
}

interface OrgSeed {
  name: string;
  code: string;
  address: string;
  contactEmail: string;
  contactPhone: string;
  contactPersonName: string;
  contactPersonEmail: string;
  contactPersonPhone: string;
}

const orgsByApex: Record<string, OrgSeed[]> = {
  APEX002: [
    {
      name: 'Lagos Island Primary', code: 'ORG002',
      address: '15 Marina Street, Lagos Island, Lagos',
      contactEmail: 'info@lagosisland.ng', contactPhone: '+2348010000002',
      contactPersonName: 'Funke Adewale', contactPersonEmail: 'funke@lagosisland.ng', contactPersonPhone: '+2348020000002',
    },
    {
      name: 'Mainland Chapter', code: 'ORG003',
      address: '7 Agege Motor Road, Mainland, Lagos',
      contactEmail: 'info@mainlandchapter.ng', contactPhone: '+2348010000003',
      contactPersonName: 'Chukwudi Okafor', contactPersonEmail: 'chukwudi@mainlandchapter.ng', contactPersonPhone: '+2348020000003',
    },
  ],
  APEX003: [
    {
      name: 'Civil Service Credit Union', code: 'ORG004',
      address: '23 Abuja Federal Secretariat, Abuja',
      contactEmail: 'info@civilservicecu.ng', contactPhone: '+2348010000004',
      contactPersonName: 'Grace Okonkwo', contactPersonEmail: 'grace@civilservicecu.ng', contactPersonPhone: '+2348020000004',
    },
  ],
  APEX004: [
    {
      name: 'Startup Innovators Network', code: 'ORG005',
      address: '10 Yaba Tech Hub, Yaba, Lagos',
      contactEmail: 'hello@startupinnovators.ng', contactPhone: '+2348010000005',
      contactPersonName: 'Segun Adeyemi', contactPersonEmail: 'segun@startupinnovators.ng', contactPersonPhone: '+2348020000005',
    },
    {
      name: 'Remote Workers Guild', code: 'ORG006',
      address: '88 Banana Island Road, Ikoyi, Lagos',
      contactEmail: 'admin@remoteworkers.ng', contactPhone: '+2348010000006',
      contactPersonName: 'Ngozi Eze', contactPersonEmail: 'ngozi@remoteworkers.ng', contactPersonPhone: '+2348020000006',
    },
  ],
};
