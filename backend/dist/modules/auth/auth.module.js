"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const passport_1 = require("@nestjs/passport");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const auth_controller_1 = require("./auth.controller");
const social_auth_controller_1 = require("./social-auth.controller");
const registrations_controller_1 = require("./registrations.controller");
const auth_service_1 = require("./auth.service");
const jwt_strategy_1 = require("./strategies/jwt.strategy");
const google_strategy_1 = require("./strategies/google.strategy");
const user_entity_1 = require("../users/entities/user.entity");
const apex_organization_entity_1 = require("../apex-organizations/entities/apex-organization.entity");
const organization_entity_1 = require("../organizations/entities/organization.entity");
const login_history_entity_1 = require("./entities/login-history.entity");
const device_session_entity_1 = require("./entities/device-session.entity");
const device_session_service_1 = require("./device-session.service");
const users_module_1 = require("../users/users.module");
const retention_module_1 = require("../../common/retention.module");
const first_virtual_module_1 = require("../first-virtual/first-virtual.module");
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                user_entity_1.User,
                apex_organization_entity_1.ApexOrganization,
                organization_entity_1.Organization,
                login_history_entity_1.LoginHistory,
                device_session_entity_1.DeviceSession,
            ]),
            passport_1.PassportModule.register({ defaultStrategy: 'jwt' }),
            jwt_1.JwtModule.registerAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (configService) => ({
                    secret: configService.get('jwt.accessSecret') || 'default-access-secret',
                    signOptions: {
                        expiresIn: (configService.get('jwt.accessExpiry') ||
                            '15m'),
                    },
                }),
            }),
            users_module_1.UsersModule,
            retention_module_1.RetentionModule,
            first_virtual_module_1.FirstVirtualModule,
        ],
        controllers: [auth_controller_1.AuthController, social_auth_controller_1.SocialAuthController, registrations_controller_1.RegistrationsController],
        providers: [auth_service_1.AuthService, device_session_service_1.DeviceSessionService, jwt_strategy_1.JwtStrategy, google_strategy_1.GoogleStrategy],
        exports: [auth_service_1.AuthService, jwt_1.JwtModule, passport_1.PassportModule],
    })
], AuthModule);
//# sourceMappingURL=auth.module.js.map