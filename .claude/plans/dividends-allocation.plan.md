# Plan: Dividends Allocation & Distribution Enhancement

**Complexity**: Medium-High
**Estimated Effort**: 20-30 hours

## Summary
Build a comprehensive dividends allocation system on top of the existing `Distribution`/`DistributionRun`/`DistributionPayment` infrastructure. Add automated calculation from profit-sharing rules, dividend reinvestment (DRIP), tax withholding, scheduling calendar, and enhanced reporting — transforming the manual distribution workflow into a configurable, automated dividend engine.

## Patterns to Mirror

| Category | Source | Pattern |
|----------|--------|---------|
| Distribution Engine | `backend/src/modules/investments/investments.service.ts:968-1150` | `createDistribution` → `computeDistributionRun` → `approveDistributionRun` → `executeDistributionRun` pipeline |
| Transactional Payouts | `backend/src/modules/investments/investments.service.ts:1040-1093` | `dataSource.transaction` with pessimistic locking on `DistributionRun` |
| Profit Sharing Rules | `backend/src/modules/investments/entities/investment-product.entity.ts` | `profitSharingRules` JSON field on `InvestmentProduct` |
| Holding-Based Calculation | `backend/src/modules/investments/investments.service.ts:1053-1062` | Iterate holdings, compute `units * amountPerUnit` per holder |
| Audit Logging | `backend/src/common/audit.service.ts` | `AuditAction` enum, structured metadata on every state change |
| Scheduler Integration | `backend/src/common/scheduler/scheduler.module.ts` | `ScheduleModule.forRoot()`, cron jobs for recurring tasks |
| Notification Integration | `backend/src/modules/notifications/notifications.service.ts` | `create()` with userId, title, message, type; realtime via `RealtimeService` |
| Settings Service | `backend/src/modules/settings/settings.service.ts` | Platform-wide config with typed getters (`getNumber`, `getBoolean`) |

## Files to Change

| File | Action | Why |
|------|--------|-----|
| `backend/src/modules/investments/entities/dividend-policy.entity.ts` | CREATE | New entity: dividend policy per product (frequency, calculation method, DRIP, tax) |
| `backend/src/modules/investments/entities/dividend-calendar.entity.ts` | CREATE | Scheduled dividend events with cron-like scheduling |
| `backend/src/modules/investments/entities/dividend-reinvestment.entity.ts` | CREATE | DRIP enrollment per user per product |
| `backend/src/modules/investments/entities/tax-withholding.entity.ts` | CREATE | Tax withholding records per payment |
| `backend/src/modules/investments/investments.service.ts` | UPDATE | Add automated calculation, DRIP execution, tax withholding, calendar engine |
| `backend/src/modules/investments/investments.controller.ts` | UPDATE | New endpoints: dividend policies, calendar, DRIP enrollment, tax reports |
| `backend/src/modules/investments/investments.module.ts` | UPDATE | Register new entities, export service |
| `backend/src/common/scheduler/dividend-scheduler.service.ts` | CREATE | Cron jobs: compute scheduled dividends, process DRIP, send reminders |
| `backend/src/modules/notifications/notifications.service.ts` | UPDATE | Add dividend-specific notification templates |
| `backend/src/modules/admin/admin.service.ts` | UPDATE | Dividend oversight: bulk approve, tax reports, compliance checks |
| `backend/database/seeds/seed-dividend-policies.ts` | CREATE | Seed default dividend policies for existing products |
| `web/src/pages/investments/DividendDashboard.tsx` | CREATE | Member view: dividend history, upcoming, DRIP settings, tax docs |
| `web/src/pages/admin/DividendManagement.tsx` | CREATE | Admin view: policy config, calendar, run management, tax reports |
| `web/src/components/investments/DividendCalendar.tsx` | CREATE | Visual calendar of record/pay dates |
| `web/src/components/investments/DRIPEnrollment.tsx` | CREATE | DRIP opt-in/opt-out per product |
| `mobile/src/screens/investments/DividendsScreen.tsx` | CREATE | Mobile dividend dashboard |
| `mobile/src/components/DividendCard.tsx` | CREATE | Mobile dividend list item with DRIP toggle |

## Tasks

### Task 1: Dividend Policy Entity & Configuration
- **Action**: Create `DividendPolicy` entity linked to `InvestmentProduct` (one-to-one): `calculationMethod` (FIXED_PER_UNIT | PERCENT_OF_NAV | PROFIT_SHARE | MANUAL), `frequency` (MONTHLY | QUARTERLY | SEMI_ANNUAL | ANNUAL | MATURITY | CUSTOM_CRON), `customCron` (for CUSTOM_CRON), `dripEnabled` (boolean), `dripDefault` (boolean), `taxWithholdingRate` (decimal, nullable), `minPayoutThreshold` (decimal), `reinvestmentPrice` (NAV | MARKET | FIXED), `fixedReinvestmentPrice` (decimal, nullable), `announcementDaysBeforeRecord` (int), `isActive` (boolean)
- **Mirror**: Follow `PricingConfig` entity pattern (one-to-one with product); use `@Column({ type: 'jsonb' })` for flexible rule storage
- **Validate**: `npm run build`; migration generates; seed creates policies for existing products

### Task 2: Dividend Calendar Entity & Scheduling
- **Action**: Create `DividendCalendar` entity: `productId`, `policyId`, `scheduledRecordDate`, `scheduledPayDate`, `status` (PENDING | COMPUTING | READY | APPROVED | EXECUTED | SKIPPED | FAILED), `distributionId` (nullable, set after compute), `runId` (nullable), `skipReason` (nullable), `createdBy`; add unique index on `(productId, scheduledRecordDate)`; add `nextOccurrence` computed field for scheduler
- **Mirror**: Follow `ShareIssuanceCycle` entity pattern (status enum, dates, audit fields); use `DistributionFrequency` enum where applicable
- **Validate**: CRUD endpoints work; calendar shows next 12 months per product

### Task 3: Automated Dividend Calculation Engine
- **Action**: Add `calculateDividendAmount(productId: string, recordDate: Date)` in `InvestmentsService`:
  - Load `DividendPolicy` + `InvestmentProduct`
  - Switch on `calculationMethod`:
    - `FIXED_PER_UNIT`: return policy `amountPerUnit` (from policy or distribution draft)
    - `PERCENT_OF_NAV`: fetch latest `NavSnapshot`, return `nav * policy.payoutPercentage / 100`
    - `PROFIT_SHARE`: execute `profitSharingRules` JSON logic (e.g., `{ "basis": "net_income", "percentage": 80, "reservePercentage": 20 }`) — query ledger for product's fee pot / P&L
    - `MANUAL`: throw (requires admin input)
  - Apply `minPayoutThreshold` (skip if below)
  - Return `{ amountPerUnit, totalPool, eligibleHoldingsCount, calculationDetails }`
- **Mirror**: Follow `computeDistributionRun()` pattern (transactional, holdings iteration); follow `PricingConfig` NAV-based pricing logic
- **Validate**: Unit tests for each calculation method; integration test with sample holdings

### Task 4: Dividend Reinvestment Program (DRIP)
- **Action**: Create `DividendReinvestment` entity: `userId`, `productId`, `enrolledAt`, `isActive`, `priceSource` (NAV | MARKET | FIXED), `fixedPrice` (nullable); add `dripEnroll(userId, productId, opts)`, `dripUnenroll(userId, productId)` in service; modify `executeDistributionRun()` to:
  - For each `DistributionPayment` where user has active DRIP → create reinvestment order instead of cash payout
  - Calculate units: `payment.amount / reinvestmentPrice` (NAV from latest snapshot, or fixed)
  - Create `InvestmentOrder` with `status: DRIP_REINVESTED`, link to `DistributionPayment`
  - Mark `DistributionPayment.isPaid = true` with `paidAt`, add `reinvestmentOrderId`
- **Mirror**: Follow `confirmPayment()` → `InvestmentHolding` creation pattern; follow `placeOrder()` for unit calculation
- **Validate**: DRIP enrollment persists; distribution run creates orders for enrolled users; cash paid for non-enrolled

### Task 5: Tax Withholding Engine
- **Action**: Create `TaxWithholding` entity: `distributionPaymentId`, `userId`, `productId`, `grossAmount`, `withholdingRate`, `withheldAmount`, `netAmount`, `taxCertificateNumber` (nullable), `jurisdiction`, `status` (WITHHELD | REMITTED | REFUNDED | EXEMPT); add `calculateWithholding(userId, grossAmount, productId)` using user's tax residency (from KYC/profile) and product jurisdiction; integrate into `executeDistributionRun()` — create `TaxWithholding` record per payment; admin endpoint to mark remitted, generate tax certificates
- **Mirror**: Follow `DistributionPayment` structure; follow `AuditService` for tax event logging; follow `SettingsService` for default withholding rates per jurisdiction
- **Validate**: Withholding calculated correctly per jurisdiction; tax certificate generation works; admin can export withholding report

### Task 6: Dividend Scheduler (Cron Jobs)
- **Action**: Create `DividendSchedulerService` with cron jobs (via `ScheduleModule`):
  - **Daily 02:00**: Check `DividendCalendar` for `scheduledRecordDate === today` → call `computeScheduledDividend(productId)` which: loads policy, calculates amount, creates `Distribution` (DRAFT), links to calendar, creates `DistributionRun` (COMPUTING), computes payouts, sets run to `PAYOUTS_READY`, sets calendar to `READY`
  - **Daily 03:00**: Check calendar for `scheduledPayDate === today` AND `status === APPROVED` → auto-execute `executeDistributionRun()` if `autoExecute` policy flag set
  - **Daily 09:00**: Send announcement notifications (`announcementDaysBeforeRecord` before record date) via `NotificationsService` + realtime
  - **Monthly 1st**: Generate tax withholding summary report for prior month
- **Mirror**: Follow `ThrottleSweepService` pattern (cron, transactional, logging); follow `SchedulerModule` registration
- **Validate**: Scheduler triggers correctly in dev; manual trigger endpoint for testing

### Task 7: Admin Dividend Management UI & Workflow
- **Action**: Admin endpoints in `InvestmentsController` (guarded by `super_admin`/`investment_manager` roles):
  - `POST /admin/dividend-policies` CRUD
  - `POST /admin/dividend-calendar` CRUD + bulk generate from policy
  - `POST /admin/dividends/:id/compute` (manual trigger)
  - `POST /admin/dividends/:id/approve` (bulk approve runs)
  - `GET /admin/dividends/tax-report?from&to&jurisdiction` (CSV export)
  - `GET /admin/dividends/compliance-check` (flag: unpaid > 30d, DRIP failures, threshold breaches)
- **Mirror**: Follow `AdminController` patterns (role guards, validation); follow `Distribution` approval workflow
- **Validate**: Admin can manage full lifecycle; tax report CSV downloads

### Task 8: Member Dividend Dashboard (Web)
- **Action**: Create `DividendDashboard.tsx` page (route `/investments/dividends`):
  - **Upcoming**: Calendar view of record/pay dates for held products
  - **History**: Table of paid dividends (date, product, gross, tax, net, DRIP units)
  - **DRIP Settings**: Per-product toggle with price source selector
  - **Tax Documents**: Download withholding certificates (PDF generation via backend)
  - **Total Earned**: Summary cards (YTD, lifetime, by product)
- **Mirror**: Follow `DashboardModule` pattern; use `InvestmentsService.getMyDistributionHistory()` + new `getDividendSummary()`; follow `AppLayout.tsx` for auth
- **Validate**: Page loads, data accurate, DRIP toggle persists, tax PDF downloads

### Task 9: Admin Dividend Management UI (Web)
- **Action**: Create `DividendManagement.tsx` page (route `/admin/investments/dividends`):
  - **Policies Tab**: Table of all products' dividend policies, inline edit
  - **Calendar Tab**: Monthly calendar view, drag-to-reschedule, bulk actions
  - **Runs Tab**: Distribution runs table with status badges, approve/reject/execute buttons
  - **Tax Tab**: Withholding report generator (date range, jurisdiction, export CSV/PDF)
  - **Compliance Tab**: Alerts for overdue payments, failed DRIPs, policy violations
- **Mirror**: Follow `AdminModule` page patterns; use `lucide-react` icons; follow `tailwind-merge` styling
- **Validate**: All tabs functional; bulk actions work; exports correct

### Task 10: Mobile Dividend Screens
- **Action**: Create `DividendsScreen.tsx` (stack screen in investments tab): list of upcoming + past dividends with pull-to-refresh; `DividendCard.tsx` component showing product, dates, amount, DRIP status badge; DRIP toggle in card menu; tax certificate download via share sheet
- **Mirror**: Follow `mobile/src/screens/investments/` patterns; use `react-navigation` stack; follow `AuthStore` for token
- **Validate**: Mobile app shows dividends; DRIP toggle works offline-first (queue + sync)

### Task 11: Enhanced Notifications & Realtime
- **Action**: Add dividend notification templates in `NotificationTemplate` seed: `DIVIDEND_ANNOUNCED`, `DIVIDEND_PAID`, `DRIP_REINVESTED`, `TAX_CERTIFICATE_READY`; hook into `InvestmentsService`:
  - On `computeDistributionRun()` → send `DIVIDEND_ANNOUNCED` to all eligible holders
  - On `executeDistributionRun()` → send `DIVIDEND_PAID` (cash) or `DRIP_REINVESTED` (reinvestment)
  - On tax certificate generation → send `TAX_CERTIFICATE_READY`
  - Use `RealtimeService.publishNotification()` for live updates
- **Mirror**: Follow `NotificationsService.create()` pattern; follow `RealtimeService` integration in `AuthService.login()`
- **Validate**: Notifications appear in real-time on web/mobile; templates render correctly

### Task 12: Reporting & Analytics
- **Action**: Add `getDividendAnalytics(productId?, from, to)` in service returning:
  - Total distributed, avg yield, payout ratio
  - DRIP participation rate (by product, overall)
  - Tax withholding totals by jurisdiction
  - Payment success/failure rates
  - Upcoming calendar summary
  - Export endpoints for CSV/PDF (admin) and member statements
- **Mirror**: Follow `getPortfolioSummary()` aggregation pattern; follow `getInvestmentStatement()` structure
- **Validate**: Analytics match manual calculations; exports open correctly

## Validation

```bash
# Backend
cd backend && npm run build && npm run test -- investments.service.spec.ts
cd backend && npm run test:e2e -- dividend.e2e-spec.ts

# Manual test flow
# 1. Create product with dividend policy (FIXED_PER_UNIT, QUARTERLY, DRIP enabled)
# 2. Seed calendar for next 4 quarters
# 3. Create test holdings for 3 users (2 DRIP enrolled, 1 not)
# 4. Trigger scheduler manually or wait for cron
# 5. Verify: Distribution created, run computed, payouts calculated
# 6. Admin approves run
# 7. Execute run (or wait for pay date cron)
# 8. Verify: DRIP users get InvestmentOrders, non-DRIP get cash DistributionPayments
# 9. Verify: TaxWithholding records created for all
# 10. Verify: Notifications sent (web realtime + mobile)
# 11. Check member dividend dashboard shows correct data
# 12. Check admin tax report CSV export

# Web
cd web && npm run build && npm run lint

# Mobile
cd mobile && npm run build  # or expo export
```

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Complex profit-sharing rule evaluation | High | Start with FIXED_PER_UNIT and PERCENT_OF_NAV; add PROFIT_SHARE as scriptable JSON logic with sandboxed evaluation |
| DRIP fractional units handling | Medium | Define rounding policy (floor units, carry remainder to cash); store remainder in `DistributionPayment.reinvestmentRemainder` |
| Tax jurisdiction complexity | High | MVP: single jurisdiction with configurable rate; v2: multi-jurisdiction via user tax residency field |
| Scheduler reliability (missed runs) | Medium | Idempotent calendar status checks; manual trigger endpoint; alerting on `SKIPPED`/`FAILED` |
| Distribution run concurrency | Low | Pessimistic locking on `DistributionRun` (already in `executeDistributionRun`) |
| Historical data migration | Low | Seed script backfills `DividendPolicy` for existing products; calendar generated from policy frequency |
| Notification spam (many small dividends) | Low | Batch announcements; user preference for digest vs immediate |

## Acceptance
- [ ] `DividendPolicy` entity created, migrated, seeded for all products
- [ ] Automated calculation works for FIXED_PER_UNIT, PERCENT_OF_NAV, PROFIT_SHARE
- [ ] `DividendCalendar` generates schedules from policy; scheduler triggers compute/execute
- [ ] DRIP: users enroll per product; distribution run creates reinvestment orders for enrolled
- [ ] Tax withholding: calculated per payment, recorded, admin can export report, certificates generated
- [ ] Scheduler cron jobs run reliably; manual triggers work for testing
- [ ] Admin UI: full policy/calendar/run/tax management
- [ ] Member UI: dividend dashboard with history, upcoming, DRIP settings, tax docs
- [ ] Mobile UI: dividend screen with DRIP toggle
- [ ] Notifications: announced, paid, DRIP, tax cert — realtime on web, push-ready on mobile
- [ ] Analytics: yield, DRIP rate, tax totals, compliance checks
- [ ] All validation commands pass