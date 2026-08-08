"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedLoans = seedLoans;
const loan_entity_1 = require("../../modules/loans/entities/loan.entity");
const loan_repayment_entity_1 = require("../../modules/loans/entities/loan-repayment.entity");
const user_entity_1 = require("../../modules/users/entities/user.entity");
const role_enum_1 = require("../../common/enums/role.enum");
async function seedLoans(dataSource) {
    const loanRepo = dataSource.getRepository(loan_entity_1.Loan);
    const repaymentRepo = dataSource.getRepository(loan_repayment_entity_1.LoanRepayment);
    const individuals = await dataSource.getRepository(user_entity_1.User).find({ where: { role: role_enum_1.Role.INDIVIDUAL } });
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
                status: loan_entity_1.LoanStatus.ACTIVE,
            });
            const repayments = [];
            for (let i = 1; i <= duration; i++) {
                const dueDate = new Date();
                dueDate.setMonth(dueDate.getMonth() + i);
                repayments.push({
                    loanId: loan.id,
                    dueDate,
                    amount: monthlyPayment,
                    status: loan_repayment_entity_1.RepaymentStatus.PENDING,
                });
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
            status: loan_entity_1.LoanStatus.ACTIVE,
        });
        const repayments = [];
        for (let i = 1; i <= duration; i++) {
            const dueDate = new Date();
            dueDate.setMonth(dueDate.getMonth() + i);
            repayments.push({
                loanId: loan.id,
                dueDate,
                amount: monthlyPayment,
                status: i === 1 ? loan_repayment_entity_1.RepaymentStatus.PAID : loan_repayment_entity_1.RepaymentStatus.PENDING,
                paidAt: i === 1 ? new Date() : null,
            });
        }
        await repaymentRepo.save(repayments);
        console.log(`Seeded active loan for ${user.email}: ₦${amount.toLocaleString()} over ${duration} months`);
    }
    console.log('Loans seeded successfully');
}
//# sourceMappingURL=seed-loans.js.map