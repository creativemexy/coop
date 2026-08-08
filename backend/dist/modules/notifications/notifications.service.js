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
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const in_app_notification_entity_1 = require("./entities/in-app-notification.entity");
let NotificationsService = class NotificationsService {
    repo;
    constructor(repo) {
        this.repo = repo;
    }
    async findByUser(userId, limit = 50, offset = 0) {
        const [data, total] = await this.repo.findAndCount({
            where: { userId },
            order: { createdAt: 'DESC' },
            take: limit,
            skip: offset,
        });
        return { data, total, unread: await this.repo.count({ where: { userId, isRead: false } }) };
    }
    async markAsRead(id, userId) {
        await this.repo.update({ id, userId }, { isRead: true });
    }
    async markAllAsRead(userId) {
        await this.repo.update({ userId, isRead: false }, { isRead: true });
    }
    async create(dto) {
        const notification = this.repo.create(dto);
        return this.repo.save(notification);
    }
    async getUnreadCount(userId) {
        return this.repo.count({ where: { userId, isRead: false } });
    }
    async delete(id, userId) {
        await this.repo.delete({ id, userId });
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(in_app_notification_entity_1.InAppNotification)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map