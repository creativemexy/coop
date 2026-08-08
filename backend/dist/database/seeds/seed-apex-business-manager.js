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
exports.seedApexBusinessManager = seedApexBusinessManager;
const bcrypt = __importStar(require("bcrypt"));
const role_enum_1 = require("../../common/enums/role.enum");
const user_entity_1 = require("../../modules/users/entities/user.entity");
const apex_organization_entity_1 = require("../../modules/apex-organizations/entities/apex-organization.entity");
const encryption_service_1 = require("../../common/encryption.service");
async function seedApexBusinessManager(dataSource) {
    const userRepo = dataSource.getRepository(user_entity_1.User);
    const apexRepo = dataSource.getRepository(apex_organization_entity_1.ApexOrganization);
    const apexOrgs = await apexRepo.find();
    if (apexOrgs.length === 0) {
        console.log('No apex orgs found, skipping apex BM seed');
        return;
    }
    let seeded = 0;
    for (const apexOrg of apexOrgs) {
        const existing = await userRepo.findOne({
            where: { role: role_enum_1.Role.APEX_BUSINESS_MANAGER, apexOrgId: apexOrg.id },
        });
        if (existing) {
            console.log(`Apex BM for ${apexOrg.code} already exists, skipping`);
            continue;
        }
        const passwordHash = await bcrypt.hash('ApexBM@123456', 10);
        const slug = apexOrg.code.toLowerCase().replace(/[^a-z0-9]/g, '');
        await userRepo.save({
            email: `apexbm-${slug}@coop.com`,
            emailHash: (0, encryption_service_1.hashForLookup)(`apexbm-${slug}@coop.com`),
            passwordHash,
            firstName: 'Apex',
            lastName: `BM - ${apexOrg.name}`,
            phone: '08000000006',
            role: role_enum_1.Role.APEX_BUSINESS_MANAGER,
            apexOrgId: apexOrg.id,
            isActive: true,
        });
        console.log(`Apex BM seeded for ${apexOrg.code}: apexbm-${slug}@coop.com / ApexBM@123456`);
        seeded++;
    }
    if (seeded === 0)
        console.log('All apex BMs already exist, skipping');
}
//# sourceMappingURL=seed-apex-business-manager.js.map