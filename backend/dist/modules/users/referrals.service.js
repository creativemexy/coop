"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReferralsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const referral_entity_1 = require("./entities/referral.entity");
const user_entity_1 = require("./entities/user.entity");
let ReferralsService = class ReferralsService {
    referralRepo;
    userRepo;
    constructor(referralRepo, userRepo) {
        this.referralRepo = referralRepo;
        this.userRepo = userRepo;
    }
    async getReferrals(userId) {
        const [sent, received] = await Promise.all([
            this.referralRepo.find({ where: { referrerId: userId }, order: { createdAt: 'DESC' } }),
            this.referralRepo.find({ where: { refereeId: userId }, order: { createdAt: 'DESC' } }),
        ]);
        return { sent, received };
    }
    async createReferral(referrerId, refereeEmail) {
        const referrer = await this.userRepo.findOne({ where: { id: referrerId } });
        if (!referrer)
            throw new common_1.BadRequestException('Referrer not found');
        const existing = await this.referralRepo.findOne({
            where: { referrerId, refereeEmail },
        });
        if (existing)
            throw new common_1.BadRequestException('Referral already sent to this email');
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
};
exports.ReferralsService = ReferralsService;
exports.ReferralsService = ReferralsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(referral_entity_1.Referral)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], ReferralsService);
//# sourceMappingURL=referrals.service.js.map