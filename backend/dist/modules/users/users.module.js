"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const users_controller_1 = require("./users.controller");
const users_service_1 = require("./users.service");
const user_entity_1 = require("./entities/user.entity");
const referral_entity_1 = require("./entities/referral.entity");
const user_activity_entity_1 = require("./entities/user-activity.entity");
const referrals_service_1 = require("./referrals.service");
const user_activity_service_1 = require("./user-activity.service");
const retention_module_1 = require("../../common/retention.module");
let UsersModule = class UsersModule {
};
exports.UsersModule = UsersModule;
exports.UsersModule = UsersModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([user_entity_1.User, referral_entity_1.Referral, user_activity_entity_1.UserActivity]), retention_module_1.RetentionModule],
        controllers: [users_controller_1.UsersController],
        providers: [users_service_1.UsersService, referrals_service_1.ReferralsService, user_activity_service_1.UserActivityService],
        exports: [users_service_1.UsersService, referrals_service_1.ReferralsService, user_activity_service_1.UserActivityService],
    })
], UsersModule);
//# sourceMappingURL=users.module.js.map