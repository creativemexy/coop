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
exports.UserActivityService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_activity_entity_1 = require("./entities/user-activity.entity");
let UserActivityService = class UserActivityService {
    repo;
    constructor(repo) {
        this.repo = repo;
    }
    async log(userId, action, details, ipAddress) {
        const activity = this.repo.create({ userId, action, details, ipAddress });
        return this.repo.save(activity);
    }
    async findByUser(userId, limit = 50, offset = 0) {
        const [data, total] = await this.repo.findAndCount({
            where: { userId },
            order: { createdAt: 'DESC' },
            take: limit,
            skip: offset,
        });
        return { data, total };
    }
};
exports.UserActivityService = UserActivityService;
exports.UserActivityService = UserActivityService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_activity_entity_1.UserActivity)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], UserActivityService);
//# sourceMappingURL=user-activity.service.js.map