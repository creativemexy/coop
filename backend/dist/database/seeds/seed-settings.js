"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedSettings = seedSettings;
const defaults = [
    { key: 'registration_fee', value: '5000' },
    { key: 'fee_platform_percent', value: '30' },
    { key: 'fee_organization_percent', value: '35' },
    { key: 'fee_apex_percent', value: '15' },
    { key: 'fee_super_admin_percent', value: '20' },
];
async function seedSettings(dataSource) {
    const repo = dataSource.getRepository('app_settings');
    for (const setting of defaults) {
        const existing = await repo.findOne({ where: { key: setting.key } });
        if (!existing) {
            await repo.save(setting);
            console.log(`Setting seeded: ${setting.key} = ${setting.value}`);
        }
    }
    console.log('Settings seeded successfully');
}
//# sourceMappingURL=seed-settings.js.map