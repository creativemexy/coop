"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedDemoData = seedDemoData;
const bcrypt = __importStar(require("bcrypt"));
const role_enum_1 = require("../../common/enums/role.enum");
const status_enum_1 = require("../../common/enums/status.enum");
const user_entity_1 = require("../../modules/users/entities/user.entity");
const apex_organization_entity_1 = require("../../modules/apex-organizations/entities/apex-organization.entity");
const organization_entity_1 = require("../../modules/organizations/entities/organization.entity");
const encryption_service_1 = require("../../common/encryption.service");
async function seedDemoData(dataSource) {
    const userRepo = dataSource.getRepository(user_entity_1.User);
    const apexRepo = dataSource.getRepository(apex_organization_entity_1.ApexOrganization);
    const orgRepo = dataSource.getRepository(organization_entity_1.Organization);
    let apexOrg = await apexRepo.findOne({ where: { code: 'APEX001' } });
    if (!apexOrg) {
        apexOrg = await apexRepo.save({
            name: 'Demo Apex Cooperative',
            code: 'APEX001',
            status: status_enum_1.OrgStatus.ACTIVE,
        });
        console.log('Demo apex org created: APEX001');
    }
    let org = await orgRepo.findOne({ where: { code: 'ORG001' } });
    if (!org) {
        org = await orgRepo.save({
            name: 'Demo Organization',
            code: 'ORG001',
            apexOrgId: apexOrg.id,
            status: status_enum_1.OrgStatus.ACTIVE,
            address: '42 Awolowo Road, Ikoyi, Lagos',
            contactEmail: 'demo@org001.ng',
            contactPhone: '+2348010000001',
            contactPersonName: 'Tunde Bakare',
            contactPersonEmail: 'tunde@org001.ng',
            contactPersonPhone: '+2348020000001',
        });
        console.log('Demo org created: ORG001');
    }
    const adminPassword = await bcrypt.hash('Admin@123456', 10);
    const adminExists = await userRepo.findOne({
        where: { emailHash: (0, encryption_service_1.hashForLookup)('admin@demo.com') },
    });
    if (!adminExists) {
        await userRepo.save({
            email: 'admin@demo.com',
            emailHash: (0, encryption_service_1.hashForLookup)('admin@demo.com'),
            passwordHash: adminPassword,
            firstName: 'Demo',
            lastName: 'Admin',
            phone: '08000000002',
            role: role_enum_1.Role.OPERATIONAL_ADMIN,
            apexOrgId: apexOrg.id,
            isActive: true,
        });
        console.log('Demo admin seeded: admin@demo.com / Admin@123456');
    }
    const individualPassword = await bcrypt.hash('User@123456', 10);
    const individualExists = await userRepo.findOne({
        where: { emailHash: (0, encryption_service_1.hashForLookup)('user@demo.com') },
    });
    if (!individualExists) {
        await userRepo.save({
            email: 'user@demo.com',
            emailHash: (0, encryption_service_1.hashForLookup)('user@demo.com'),
            passwordHash: individualPassword,
            firstName: 'Demo',
            lastName: 'User',
            phone: '08000000003',
            phoneHash: (0, encryption_service_1.hashForLookup)('08000000003'),
            role: role_enum_1.Role.INDIVIDUAL,
            apexOrgId: apexOrg.id,
            organizationId: org.id,
            isActive: true,
        });
        console.log('Demo individual seeded: user@demo.com / User@123456');
    }
    const bnplManagerPassword = await bcrypt.hash('BNPL@123456', 10);
    const bnplManagerExists = await userRepo.findOne({
        where: { emailHash: (0, encryption_service_1.hashForLookup)('bnpl@demo.com') },
    });
    if (!bnplManagerExists) {
        await userRepo.save({
            email: 'bnpl@demo.com',
            emailHash: (0, encryption_service_1.hashForLookup)('bnpl@demo.com'),
            passwordHash: bnplManagerPassword,
            firstName: 'BNPL',
            lastName: 'Manager',
            phone: '08000000004',
            phoneHash: (0, encryption_service_1.hashForLookup)('08000000004'),
            role: role_enum_1.Role.BNPL_MANAGER,
            apexOrgId: apexOrg.id,
            organizationId: org.id,
            isActive: true,
        });
        console.log('Demo BNPL manager seeded: bnpl@demo.com / BNPL@123456');
    }
    const accountantPassword = await bcrypt.hash('Acc@123456', 10);
    const accountantExists = await userRepo.findOne({
        where: { emailHash: (0, encryption_service_1.hashForLookup)('acc@demo.com') },
    });
    if (!accountantExists) {
        await userRepo.save({
            email: 'acc@demo.com',
            emailHash: (0, encryption_service_1.hashForLookup)('acc@demo.com'),
            passwordHash: accountantPassword,
            firstName: 'Demo',
            lastName: 'Accountant',
            phone: '08000000005',
            phoneHash: (0, encryption_service_1.hashForLookup)('08000000005'),
            role: role_enum_1.Role.ACCOUNTANT,
            apexOrgId: apexOrg.id,
            organizationId: org.id,
            isActive: true,
        });
        console.log('Demo accountant seeded: acc@demo.com / Acc@123456');
    }
    const apexOrgs = [
        { name: 'Lagos State Cooperative', code: 'APEX002' },
        { name: 'Federal Employees Alliance', code: 'APEX003' },
        { name: 'Tech Workers Cooperative', code: 'APEX004' },
    ];
    for (const a of apexOrgs) {
        let existing = await apexRepo.findOne({ where: { code: a.code } });
        if (!existing) {
            existing = await apexRepo.save({ ...a, status: status_enum_1.OrgStatus.ACTIVE });
            console.log(`Apex org created: ${a.code}`);
        }
        const orgsUnder = orgsByApex[a.code] ?? [];
        for (const o of orgsUnder) {
            const existingOrg = await orgRepo.findOne({ where: { code: o.code } });
            if (!existingOrg) {
                await orgRepo.save({ ...o, apexOrgId: existing.id, status: status_enum_1.OrgStatus.ACTIVE });
                console.log(`Org created: ${o.code}`);
            }
        }
    }
    console.log('Demo data seeded successfully');
}
const orgsByApex = {
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
//# sourceMappingURL=seed-demo-data.js.map