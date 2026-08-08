"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.backfillEncryptionHashes = backfillEncryptionHashes;
const user_entity_1 = require("../../modules/users/entities/user.entity");
const encryption_service_1 = require("../../common/encryption.service");
async function backfillEncryptionHashes(dataSource) {
    const userRepo = dataSource.getRepository(user_entity_1.User);
    const users = await userRepo.find({ where: { emailHash: null } });
    for (const user of users) {
        user.emailHash = (0, encryption_service_1.hashForLookup)(user.email);
        user.phoneHash = user.phone ? (0, encryption_service_1.hashForLookup)(user.phone) : null;
        await userRepo.save(user);
    }
    console.log(`Backfilled encryption hashes for ${users.length} users`);
}
//# sourceMappingURL=backfill-encryption-hashes.js.map