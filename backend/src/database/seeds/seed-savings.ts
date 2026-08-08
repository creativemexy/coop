import { DataSource } from 'typeorm';
import { SavingsAccount } from '../../modules/savings/entities/savings-account.entity';
import { SavingsTransaction, TransactionType } from '../../modules/savings/entities/savings-transaction.entity';
import { User } from '../../modules/users/entities/user.entity';
import { Role } from '../../common/enums/role.enum';

export async function seedSavings(dataSource: DataSource): Promise<void> {
  const accountRepo = dataSource.getRepository(SavingsAccount);
  const txRepo = dataSource.getRepository(SavingsTransaction);

  const individuals = await dataSource.getRepository(User).find({ where: { role: Role.INDIVIDUAL } });
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
        type: TransactionType.DEPOSIT,
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
        type: TransactionType.WITHDRAWAL,
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
