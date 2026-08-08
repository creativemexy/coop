import { DataSource } from 'typeorm';
import { Loan, LoanStatus } from '../../modules/loans/entities/loan.entity';
import { LoanRepayment, RepaymentStatus } from '../../modules/loans/entities/loan-repayment.entity';
import { User } from '../../modules/users/entities/user.entity';
import { Role } from '../../common/enums/role.enum';

export async function seedLoans(dataSource: DataSource): Promise<void> {
  const loanRepo = dataSource.getRepository(Loan);
  const repaymentRepo = dataSource.getRepository(LoanRepayment);

  const individuals = await dataSource.getRepository(User).find({ where: { role: Role.INDIVIDUAL } });
  if (individuals.length === 0) {
    console.log('No individual users found, skipping loan seed');
    return;
  }

  const demoUser = individuals.find((u) => u.email === 'user@demo.com');
  if (demoUser) {
    const existing = await loanRepo.findOne({ where: { userId: demoUser.id } });
    if (!existing) {
      const amount = 300000;
      const interestRate = 5;
      const duration = 3;
      const totalRepayment = amount + (amount * interestRate) / 100;
      const monthlyPayment = Math.round((totalRepayment / duration) * 100) / 100;

      const loan = await loanRepo.save({
        userId: demoUser.id,
        amount,
        interestRate,
        duration,
        monthlyPayment,
        totalRepayment,
        amountPaid: 0,
        purpose: 'Business expansion',
        status: LoanStatus.ACTIVE,
      });

      const repayments: LoanRepayment[] = [];
      for (let i = 1; i <= duration; i++) {
        const dueDate = new Date();
        dueDate.setMonth(dueDate.getMonth() + i);
        repayments.push({
          loanId: loan.id,
          dueDate,
          amount: monthlyPayment,
          status: RepaymentStatus.PENDING,
        } as LoanRepayment);
      }
      await repaymentRepo.save(repayments);
      console.log(`Seeded loan for user@demo.com: ₦${amount.toLocaleString()} over ${duration} months`);
    }
  }

  for (const user of individuals.slice(0, 2)) {
    const existing = await loanRepo.findOne({ where: { userId: user.id } });
    if (existing) {
      console.log(`Skipping loan seed for ${user.email} — already exists`);
      continue;
    }

    const amount = 200000;
    const interestRate = 5;
    const duration = 6;
    const totalRepayment = amount + (amount * interestRate) / 100;
    const monthlyPayment = Math.round((totalRepayment / duration) * 100) / 100;

    const loan = await loanRepo.save({
      userId: user.id,
      amount,
      interestRate,
      duration,
      monthlyPayment,
      totalRepayment,
      amountPaid: monthlyPayment,
      purpose: 'Home improvement',
      status: LoanStatus.ACTIVE,
    });

    const repayments: LoanRepayment[] = [];
    for (let i = 1; i <= duration; i++) {
      const dueDate = new Date();
      dueDate.setMonth(dueDate.getMonth() + i);
      repayments.push({
        loanId: loan.id,
        dueDate,
        amount: monthlyPayment,
        status: i === 1 ? RepaymentStatus.PAID : RepaymentStatus.PENDING,
        paidAt: i === 1 ? new Date() : null,
      } as LoanRepayment);
    }
    await repaymentRepo.save(repayments);

    console.log(`Seeded active loan for ${user.email}: ₦${amount.toLocaleString()} over ${duration} months`);
  }

  console.log('Loans seeded successfully');
}
