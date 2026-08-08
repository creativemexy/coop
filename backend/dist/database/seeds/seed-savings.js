"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedSavings = seedSavings;
const savings_account_entity_1 = require("../../modules/savings/entities/savings-account.entity");
const savings_transaction_entity_1 = require("../../modules/savings/entities/savings-transaction.entity");
const user_entity_1 = require("../../modules/users/entities/user.entity");
const role_enum_1 = require("../../common/enums/role.enum");
async function seedSavings(dataSource) {
    const accountRepo = dataSource.getRepository(savings_account_entity_1.SavingsAccount);
    const txRepo = dataSource.getRepository(savings_transaction_entity_1.SavingsTransaction);
    const individuals = await dataSource.getRepository(user_entity_1.User).find({ where: { role: role_enum_1.Role.INDIVIDUAL } });
    if (individuals.length === 0) {
        console.log('No individual users found, skipping savings seed');
        return;
    }
    for (const user of individuals) {
        let account = await accountRepo.findOne({ where: { userId: user.id } });
        if (!account) {
            account = await accountRepo.save({ userId: user.id, balance: 0, status: 'active' });
        }
        const existingTxCount = await txRepo.count({ where: { accountId: account.id } });
        if (existingTxCount > 0) {
            console.log(`Skipping savings seed for user ${user.email} — transactions already exist`);
            continue;
        }
        const deposits = [
            { amount: 50000, description: 'Initial savings deposit' },
            { amount: 25000, description: 'Monthly savings contribution' },
            { amount: 30000, description: 'Bonus savings deposit' },
        ];
        let balance = Number(account.balance);
        for (const deposit of deposits) {
            const balanceBefore = balance;
            balance += deposit.amount;
            await txRepo.save({
                accountId: account.id,
                type: savings_transaction_entity_1.TransactionType.DEPOSIT,
                amount: deposit.amount,
                balanceBefore,
                balanceAfter: balance,
                description: deposit.description,
            });
        }
        await accountRepo.update(account.id, { balance });
        const withdrawal = { amount: 10000, description: 'ATM withdrawal' };
        if (balance >= withdrawal.amount) {
            const balanceBefore = balance;
            balance -= withdrawal.amount;
            await txRepo.save({
                accountId: account.id,
                type: savings_transaction_entity_1.TransactionType.WITHDRAWAL,
                amount: withdrawal.amount,
                balanceBefore,
                balanceAfter: balance,
                description: withdrawal.description,
            });
            await accountRepo.update(account.id, { balance });
        }
        console.log(`Seeded savings for ${user.email}: ₦${balance.toLocaleString()}`);
    }
    console.log('Savings seeded successfully');
}
//# sourceMappingURL=seed-savings.js.map