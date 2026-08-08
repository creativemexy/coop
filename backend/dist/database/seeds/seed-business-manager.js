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
exports.seedBusinessManager = seedBusinessManager;
const bcrypt = __importStar(require("bcrypt"));
const role_enum_1 = require("../../common/enums/role.enum");
const user_entity_1 = require("../../modules/users/entities/user.entity");
const encryption_service_1 = require("../../common/encryption.service");
async function seedBusinessManager(dataSource) {
    const userRepo = dataSource.getRepository(user_entity_1.User);
    const existing = await userRepo.findOne({
        where: { role: role_enum_1.Role.BUSINESS_MANAGER, isActive: true },
    });
    if (existing) {
        console.log('Business manager already exists, skipping seed');
        return;
    }
    const passwordHash = await bcrypt.hash('BM@123456', 10);
    await userRepo.save({
        email: 'bm@coop.com',
        emailHash: (0, encryption_service_1.hashForLookup)('bm@coop.com'),
        passwordHash,
        firstName: 'Business',
        lastName: 'Manager',
        phone: '08000000001',
        phoneHash: (0, encryption_service_1.hashForLookup)('08000000001'),
        role: role_enum_1.Role.BUSINESS_MANAGER,
        isActive: true,
    });
    console.log('Business manager seeded: bm@coop.com / BM@123456');
}
//# sourceMappingURL=seed-business-manager.js.map