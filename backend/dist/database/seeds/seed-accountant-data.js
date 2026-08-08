"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedAccountantData = seedAccountantData;
const status_enum_1 = require("../../common/enums/status.enum");
const role_enum_1 = require("../../common/enums/role.enum");
const user_entity_1 = require("../../modules/users/entities/user.entity");
const organization_entity_1 = require("../../modules/organizations/entities/organization.entity");
const apex_organization_entity_1 = require("../../modules/apex-organizations/entities/apex-organization.entity");
const bnpl_subscription_entity_1 = require("../../modules/bnpl/entities/bnpl-subscription.entity");
const bnpl_installment_entity_1 = require("../../modules/bnpl/entities/bnpl-installment.entity");
const bnpl_plan_entity_1 = require("../../modules/bnpl/entities/bnpl-plan.entity");
const bnpl_catalog_item_entity_1 = require("../../modules/bnpl/entities/bnpl-catalog-item.entity");
const payment_entity_1 = require("../../modules/payments/entities/payment.entity");
const fee_share_ledger_entity_1 = require("../../modules/ledger/entities/fee-share-ledger.entity");
const fee_pot_entity_1 = require("../../modules/ledger/entities/fee-pot.entity");
const fee_withdrawal_request_entity_1 = require("../../modules/ledger/entities/fee-withdrawal-request.entity");
const adjustment_request_entity_1 = require("../../modules/accountant/entities/adjustment-request.entity");
const reconciliation_run_entity_1 = require("../../modules/accountant/entities/reconciliation-run.entity");
const reconciliation_result_entity_1 = require("../../modules/accountant/entities/reconciliation-result.entity");
const round2 = (n) => Math.round(n * 100) / 100;
async function seedAccountantData(dataSource) {
    const subRepo = dataSource.getRepository(bnpl_subscription_entity_1.BnplSubscription);
    const instRepo = dataSource.getRepository(bnpl_installment_entity_1.BnplInstallment);
    const planRepo = dataSource.getRepository(bnpl_plan_entity_1.BnplPlan);
    const itemRepo = dataSource.getRepository(bnpl_catalog_item_entity_1.BnplCatalogItem);
    const paymentRepo = dataSource.getRepository(payment_entity_1.Payment);
    const feeShareRepo = dataSource.getRepository(fee_share_ledger_entity_1.FeeShareLedger);
    const potRepo = dataSource.getRepository(fee_pot_entity_1.FeePot);
    const withdrawalRepo = dataSource.getRepository(fee_withdrawal_request_entity_1.FeeWithdrawalRequest);
    const adjRepo = dataSource.getRepository(adjustment_request_entity_1.AdjustmentRequest);
    const runRepo = dataSource.getRepository(reconciliation_run_entity_1.ReconciliationRun);
    const resultRepo = dataSource.getRepository(reconciliation_result_entity_1.ReconciliationResult);
    const userRepo = dataSource.getRepository(user_entity_1.User);
    const existingPots = await potRepo.count();
    if (existingPots > 0) {
        console.log('Skipping accountant data seed — fee pots already exist');
        return;
    }
    const users = await userRepo.find();
    const demoUser = users.find((u) => u.email === 'user@demo.com');
    const feeUser = users.find((u) => u.email === 'acctest@test.com');
    const accountant = users.find((u) => u.email === 'acc@demo.com');
    const superAdmin = users.find((u) => u.email === 'superadmin@coop.com');
    const bmOrg1 = users.find((u) => u.email === 'bm-org001@coop.com');
    if (!demoUser || !feeUser || !accountant || !superAdmin || !bmOrg1) {
        console.log('Skipping accountant data seed — required users missing');
        return;
    }
    const orgs = await dataSource.getRepository(organization_entity_1.Organization).find();
    const orgById = new Map(orgs.map((o) => [o.id, o]));
    const apexes = await dataSource.getRepository(apex_organization_entity_1.ApexOrganization).find();
    const apexByCode = new Map(apexes.map((a) => [a.code, a]));
    const orgApex = new Map([
        ['ORG001', 'APEX001'],
        ['ORG002', 'APEX002'],
        ['ORG003', 'APEX002'],
        ['ORG004', 'APEX003'],
        ['ORG005', 'APEX003'],
        ['ORG006', 'APEX004'],
    ]);
    const items = await itemRepo.find();
    const ipadItem = items.find((i) => i.name === 'iPad Air M3');
    const macbookItem = items.find((i) => i.name === 'MacBook Pro 14"');
    const samsungItem = items.find((i) => i.name === 'Samsung Galaxy S25');
    if (!ipadItem || !macbookItem || !samsungItem) {
        console.log('Skipping accountant data seed — catalog items missing');
        return;
    }
    const plans = await planRepo.find({ relations: { catalogItem: true } });
    const ipadPlan = plans.find((p) => p.catalogItem?.id === ipadItem.id && p.installmentCount === 12);
    const macbookPlan = plans.find((p) => p.catalogItem?.id === macbookItem.id && p.installmentCount === 3);
    const samsungPlan = plans.find((p) => p.catalogItem?.id === samsungItem.id && p.installmentCount === 3);
    if (!ipadPlan || !macbookPlan || !samsungPlan) {
        console.log('Skipping accountant data seed — plans missing');
        return;
    }
    const org1 = orgs.find((o) => o.code === 'ORG001');
    if (!org1) {
        console.log('Skipping accountant data seed — org/apex references missing');
        return;
    }
    const existingSubs = await subRepo.find();
    const subA = existingSubs.find((s) => s.planId === ipadPlan.id && s.status === status_enum_1.SubscriptionStatus.PENDING_PAYMENT)
        ?? existingSubs[0];
    if (!subA) {
        console.log('Skipping accountant data seed — no subscription to activate');
        return;
    }
    const monthlyA = round2(Number(subA.totalAmount) / 12);
    const paidInstCount = 6;
    const onePaidAmount = 50000;
    await subRepo.update(subA.id, {
        status: status_enum_1.SubscriptionStatus.ACTIVE_REPAYMENT,
        payoutStatus: status_enum_1.PayoutStatus.COMPLETED,
        providerReference: 'SUB-A-0001',
        disbursementReference: 'DISB-SUB-A-0001',
        disbursedAt: new Date('2026-07-25'),
        amountPaid: 5 * monthlyA + onePaidAmount,
        nextInstallmentDate: new Date('2026-08-08'),
    });
    let instA = await instRepo.find({ where: { subscriptionId: subA.id } });
    if (instA.length === 0) {
        const aDueDates = [
            '2026-07-27', '2026-07-29', '2026-07-31', '2026-08-02', '2026-08-04', '2026-08-06',
            '2026-07-28', '2026-07-30',
            '2026-08-08', '2026-09-08', '2026-10-08', '2026-11-08',
        ];
        const aInstallments = aDueDates.map((d, i) => {
            const paid = i < paidInstCount;
            const overdue = i >= paidInstCount && i < paidInstCount + 2;
            return {
                subscriptionId: subA.id,
                dueDate: new Date(d),
                amount: monthlyA,
                lateFeeAmount: overdue ? 1375 : 0,
                status: paid ? status_enum_1.InstallmentStatus.PAID : overdue ? status_enum_1.InstallmentStatus.OVERDUE : status_enum_1.InstallmentStatus.PENDING,
                paidAt: paid ? new Date(d) : undefined,
                paymentReference: paid ? `PR-INST-A-${String(i + 1).padStart(3, '0')}` : undefined,
            };
        });
        await instRepo.insert(aInstallments);
        instA = await instRepo.find({ where: { subscriptionId: subA.id } });
        console.log(`Seeded ${aInstallments.length} installments for subscription A`);
    }
    const paidInstA = instA.filter((i) => i.status === status_enum_1.InstallmentStatus.PAID);
    const overdueInstA = instA.filter((i) => i.status === status_enum_1.InstallmentStatus.OVERDUE);
    const pendingInstA = instA.filter((i) => i.status === status_enum_1.InstallmentStatus.PENDING);
    const macTotal = round2(2500000 * 1.1);
    const macMonthly = round2(macTotal / 3);
    const subB = await subRepo.findOne({ where: { providerReference: 'SUB-B-0001' } })
        ?? await subRepo.save({
            userId: demoUser.id,
            planId: macbookPlan.id,
            status: status_enum_1.SubscriptionStatus.ACTIVE_REPAYMENT,
            downPayment: 500000,
            totalAmount: macTotal,
            amountPaid: round2(500000 + macMonthly),
            payoutStatus: status_enum_1.PayoutStatus.COMPLETED,
            providerReference: 'SUB-B-0001',
            disbursementReference: 'DISB-SUB-B-0001',
            disbursedAt: new Date('2026-07-28'),
            nextInstallmentDate: new Date('2026-09-01'),
        });
    const samTotal = round2(1100000 * 1.1);
    const samMonthly = round2(samTotal / 3);
    const subC = await subRepo.findOne({ where: { providerReference: 'SUB-C-0001' } })
        ?? await subRepo.save({
            userId: feeUser.id,
            planId: samsungPlan.id,
            status: status_enum_1.SubscriptionStatus.ACTIVE_REPAYMENT,
            downPayment: 220000,
            totalAmount: samTotal,
            amountPaid: 220000,
            payoutStatus: status_enum_1.PayoutStatus.COMPLETED,
            providerReference: 'SUB-C-0001',
            disbursementReference: 'DISB-SUB-C-0001',
            disbursedAt: new Date('2026-07-29'),
            nextInstallmentDate: new Date('2026-08-01'),
        });
    const instBCount = await instRepo.count({ where: { subscriptionId: subB.id } });
    if (instBCount === 0) {
        await instRepo.insert([
            { subscriptionId: subB.id, dueDate: new Date('2026-08-01'), amount: macMonthly, status: status_enum_1.InstallmentStatus.PAID, paidAt: new Date('2026-08-01'), paymentReference: 'PR-INST-B-001' },
            { subscriptionId: subB.id, dueDate: new Date('2026-09-01'), amount: macMonthly, status: status_enum_1.InstallmentStatus.PENDING },
            { subscriptionId: subB.id, dueDate: new Date('2026-10-01'), amount: macMonthly, status: status_enum_1.InstallmentStatus.PENDING },
            { subscriptionId: subC.id, dueDate: new Date('2026-08-01'), amount: samMonthly, status: status_enum_1.InstallmentStatus.PENDING },
            { subscriptionId: subC.id, dueDate: new Date('2026-09-01'), amount: samMonthly, status: status_enum_1.InstallmentStatus.PENDING },
            { subscriptionId: subC.id, dueDate: new Date('2026-10-01'), amount: samMonthly, status: status_enum_1.InstallmentStatus.PENDING },
        ]);
        console.log(`Seeded subscriptions B (${macTotal}) and C (${samTotal}) installments`);
    }
    const feeRate = 0.015;
    const payments = [];
    paidInstA.forEach((inst, idx) => {
        const amount = idx === paidInstA.length - 1 ? onePaidAmount : monthlyA;
        payments.push({
            userId: demoUser.id,
            subscriptionId: subA.id,
            amount,
            fee: round2(amount * feeRate),
            provider: status_enum_1.PaymentProvider.PAYSTACK,
            providerReference: `PAY-INST-A-${String(idx + 1).padStart(3, '0')}`,
            status: status_enum_1.PaymentStatus.SUCCESS,
            payoutStatus: status_enum_1.PayoutStatus.COMPLETED,
            payoutReference: `POOL-INST-A-${String(idx + 1).padStart(3, '0')}`,
        });
    });
    payments.push({
        userId: demoUser.id,
        subscriptionId: subB.id,
        amount: 500000,
        fee: round2(500000 * feeRate),
        provider: status_enum_1.PaymentProvider.PAYSTACK,
        providerReference: 'PAY-DOWN-B-0001',
        status: status_enum_1.PaymentStatus.SUCCESS,
        payoutStatus: status_enum_1.PayoutStatus.COMPLETED,
        payoutReference: 'POOL-DOWN-B-0001',
    });
    payments.push({
        userId: demoUser.id,
        subscriptionId: subB.id,
        amount: macMonthly,
        fee: round2(macMonthly * feeRate),
        provider: status_enum_1.PaymentProvider.PAYSTACK,
        providerReference: 'PAY-INST-B-001',
        status: status_enum_1.PaymentStatus.SUCCESS,
        payoutStatus: status_enum_1.PayoutStatus.COMPLETED,
        payoutReference: 'POOL-INST-B-001',
    });
    payments.push({
        userId: feeUser.id,
        subscriptionId: subC.id,
        amount: 220000,
        fee: round2(220000 * feeRate),
        provider: status_enum_1.PaymentProvider.PAYSTACK,
        providerReference: 'PAY-DOWN-C-0001',
        status: status_enum_1.PaymentStatus.SUCCESS,
        payoutStatus: status_enum_1.PayoutStatus.COMPLETED,
        payoutReference: 'POOL-DOWN-C-0001',
    });
    const registrationFee = 5000;
    const orgBmUser = new Map();
    for (const org of orgs) {
        const bm = users.find((u) => u.role === role_enum_1.Role.BUSINESS_MANAGER && u.organizationId === org.id);
        if (bm)
            orgBmUser.set(org.id, bm);
        const apexId = apexByCode.get(orgApex.get(org.code) || '')?.id;
        payments.push({
            userId: bm ? bm.id : demoUser.id,
            amount: registrationFee,
            fee: 0,
            provider: status_enum_1.PaymentProvider.PAYSTACK,
            providerReference: `REG-${org.code}-001`,
            status: status_enum_1.PaymentStatus.SUCCESS,
            payoutStatus: status_enum_1.PayoutStatus.COMPLETED,
            payoutReference: `POOL-REG-${org.code}-001`,
            metadata: { purpose: 'registration' },
            ...(apexId ? { subscriptionId: undefined } : { subscriptionId: undefined }),
        });
    }
    const existingPayments = await paymentRepo.find();
    const existingRefs = new Set(existingPayments.map((p) => p.providerReference));
    const newPayments = payments.filter((p) => p.providerReference && !existingRefs.has(p.providerReference));
    if (newPayments.length > 0) {
        await paymentRepo.insert(newPayments);
        console.log(`Seeded ${newPayments.length} payments`);
    }
    const savedPayments = await paymentRepo.find({ order: { createdAt: 'ASC' } });
    const savedRegPayments = savedPayments.filter((p) => p.providerReference?.startsWith('REG-'));
    const existingShares = await feeShareRepo.find();
    const sharedPaymentIds = new Set(existingShares.map((s) => s.paymentId));
    const feeShares = [];
    for (const p of savedRegPayments) {
        if (sharedPaymentIds.has(p.id))
            continue;
        const org = orgs.find((o) => `REG-${o.code}-001` === p.providerReference);
        if (!org)
            continue;
        const apexId = apexByCode.get(orgApex.get(org.code) || '')?.id;
        feeShares.push({
            paymentId: p.id,
            source: status_enum_1.FeeSource.REGISTRATION,
            totalFee: Number(p.amount),
            superAdminShare: round2(Number(p.amount) * 0.2),
            superAdminUserId: superAdmin.id,
            platformShare: round2(Number(p.amount) * 0.3),
            organizationShare: round2(Number(p.amount) * 0.35),
            organizationId: org.id,
            apexShare: round2(Number(p.amount) * 0.15),
            ...(apexId ? { apexOrgId: apexId } : {}),
        });
    }
    if (feeShares.length > 0) {
        await feeShareRepo.insert(feeShares);
        console.log(`Seeded ${feeShares.length} fee share records`);
    }
    const adminWithdrawal = 4000;
    const potTotals = new Map();
    const key = (potType, entityId) => `${potType}|${entityId}`;
    for (const f of feeShares) {
        potTotals.set(key(status_enum_1.PotType.PLATFORM, 'PLATFORM'), (potTotals.get(key(status_enum_1.PotType.PLATFORM, 'PLATFORM')) || 0) + Number(f.platformShare));
        potTotals.set(key(status_enum_1.PotType.ADMIN, 'ADMIN'), (potTotals.get(key(status_enum_1.PotType.ADMIN, 'ADMIN')) || 0) + Number(f.superAdminShare));
        if (f.organizationId) {
            potTotals.set(key(status_enum_1.PotType.ORGANIZATION, String(f.organizationId)), (potTotals.get(key(status_enum_1.PotType.ORGANIZATION, String(f.organizationId))) || 0) + Number(f.organizationShare));
        }
        if (f.apexOrgId) {
            potTotals.set(key(status_enum_1.PotType.APEX, String(f.apexOrgId)), (potTotals.get(key(status_enum_1.PotType.APEX, String(f.apexOrgId))) || 0) + Number(f.apexShare));
        }
    }
    const pots = [];
    for (const [k, total] of potTotals) {
        const [potType, entityId] = k.split('|');
        let balance = round2(total);
        if (potType === status_enum_1.PotType.ADMIN)
            balance = round2(balance - adminWithdrawal);
        pots.push({ potType: potType, entityId, balance });
    }
    await potRepo.insert(pots);
    console.log(`Seeded ${pots.length} fee pots`);
    const platformPot = pots.find((p) => p.potType === status_enum_1.PotType.PLATFORM);
    const withdrawalCount = await withdrawalRepo.count();
    if (withdrawalCount === 0) {
        await withdrawalRepo.insert([
            {
                potType: status_enum_1.PotType.ADMIN,
                amount: adminWithdrawal,
                status: status_enum_1.PayoutStatus.COMPLETED,
                requestedBy: superAdmin.id,
                approvedBy: superAdmin.id,
                accountNumber: '0123456789',
                bankCode: '058',
                bankName: 'GTBank',
                note: 'Admin pot withdrawal — processed by super admin',
            },
            {
                potType: status_enum_1.PotType.PLATFORM,
                amount: platformPot ? Number(platformPot.balance) : 0,
                status: status_enum_1.PayoutStatus.PENDING,
                requestedBy: accountant.id,
                note: 'Platform pot withdrawal request — pending super admin approval',
            },
        ]);
        console.log('Seeded withdrawal requests (1 admin completed, 1 platform pending)');
    }
    const adjCount = await adjRepo.count();
    if (adjCount === 0) {
        await adjRepo.insert([
            {
                adjustmentType: adjustment_request_entity_1.AdjustmentType.METADATA_CORRECTION,
                description: 'Installment marked paid but payment reference missing from webhook payload',
                reasonCode: 'MISSING_WEBHOOK',
                changes: { paymentReference: `PR-INST-A-${String(paidInstA.length).padStart(3, '0')}` },
                referenceType: 'installment',
                referenceId: paidInstA[0].id,
                status: adjustment_request_entity_1.AdjustmentStatus.PENDING,
                requestedBy: accountant.id,
            },
            {
                adjustmentType: adjustment_request_entity_1.AdjustmentType.METADATA_CORRECTION,
                description: 'Corrected due date recorded against wrong installment',
                reasonCode: 'DATA_ENTRY_ERROR',
                changes: { dueDate: '2026-08-08', notes: 'Re-scheduled after grace period' },
                referenceType: 'installment',
                referenceId: pendingInstA[0].id,
                status: adjustment_request_entity_1.AdjustmentStatus.APPROVED,
                requestedBy: accountant.id,
                reviewedBy: superAdmin.id,
                reviewedAt: new Date('2026-07-30'),
            },
            {
                adjustmentType: adjustment_request_entity_1.AdjustmentType.JOURNAL_ENTRY,
                description: 'Duplicate journal entry proposed for BNPL fee income',
                reasonCode: 'DUPLICATE_ENTRY',
                changes: {},
                referenceType: 'journal',
                status: adjustment_request_entity_1.AdjustmentStatus.REJECTED,
                requestedBy: accountant.id,
                reviewedBy: superAdmin.id,
                reviewedAt: new Date('2026-07-29'),
                rejectionReason: 'Identical entry already posted on the same date',
            },
        ]);
        console.log('Seeded 3 adjustment requests');
    }
    const expected = monthlyA;
    const run = await runRepo.findOne({ where: { rangeStart: new Date('2026-07-27'), organizationId: org1.id } })
        ?? await runRepo.save({
            rangeStart: new Date('2026-07-27'),
            rangeEnd: new Date('2026-08-06'),
            organizationId: org1.id,
            runBy: accountant.id,
            status: reconciliation_run_entity_1.ReconciliationStatus.COMPLETED,
            totalExpected: 8,
            totalActual: 8,
            matchCount: 5,
            mismatchCount: 3,
            expectedAmount: round2(8 * expected),
            actualAmount: round2(5 * expected + onePaidAmount),
            discrepancy: round2(8 * expected - (5 * expected + onePaidAmount)),
            completedAt: new Date(),
        });
    const resultCount = await resultRepo.count({ where: { runId: run.id } });
    if (resultCount === 0) {
        const results = [];
        paidInstA.forEach((inst, idx) => {
            const isUnderpaid = idx === paidInstA.length - 1;
            const actual = isUnderpaid ? onePaidAmount : expected;
            results.push({
                runId: run.id,
                subscriptionId: subA.id,
                installmentId: inst.id,
                expectedAmount: expected,
                actualAmount: actual,
                discrepancy: round2(expected - actual),
                expectedDate: inst.dueDate,
                actualDate: inst.paidAt,
                status: isUnderpaid ? reconciliation_result_entity_1.ResultStatus.NEEDS_REVIEW : reconciliation_result_entity_1.ResultStatus.MATCHED,
                flags: isUnderpaid ? ['amount_mismatch'] : [],
                organizationId: org1.id,
            });
        });
        overdueInstA.forEach((inst) => {
            results.push({
                runId: run.id,
                subscriptionId: subA.id,
                installmentId: inst.id,
                expectedAmount: round2(expected + Number(inst.lateFeeAmount)),
                actualAmount: 0,
                discrepancy: round2(expected + Number(inst.lateFeeAmount)),
                expectedDate: inst.dueDate,
                status: reconciliation_result_entity_1.ResultStatus.UNMATCHED,
                flags: ['missing_payment'],
                organizationId: org1.id,
            });
        });
        await resultRepo.insert(results);
        console.log(`Seeded reconciliation run with ${results.length} results`);
    }
    console.log('Accountant data seeded successfully');
}
//# sourceMappingURL=seed-accountant-data.js.map