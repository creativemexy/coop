# Shared BNPL Plans Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show one shared active BNPL plan set to every KYC-approved individual while applying that individual's organization-specific eligibility and repayment configuration.

**Architecture:** Make plan records global and store organization ownership on each subscription. Read organization-level financial configuration from the subscription owner throughout eligibility, disbursement, repayment scheduling, and manager reporting. Enforce approved, unexpired KYC at plan-list and eligibility/subscription boundaries.

**Tech Stack:** NestJS, TypeORM, PostgreSQL, Jest, React/TypeScript.

**Spec:** `docs/superpowers/specs/2026-10-19-shared-bnpl-plans-design.md`

## Global Constraints

- Preserve existing plan IDs and subscription financial amounts.
- Preserve organization-specific max principal, membership, interest model, and repayment schedule settings.
- Do not allow unapproved or expired KYC to retrieve/subscribe to individual plans.
- Do not weaken organization isolation for subscription and order data.

## Review Focus

- A member from a different organization sees the same global plans but eligibility uses their own organization config.
- A member with missing organization uses existing defaults and remains reportable without a tenant leak.
- Existing subscriptions retain plan references and get their organization from the owning user.
- Plan listing and eligibility reject KYC states other than approved and reject expired verification.
- Organization manager reports include subscriptions by subscription organization, not global plan ownership.

---

### Task 1: Global plan schema and data migration

**Files:**
- Modify: `backend/src/modules/bnpl/entities/bnpl-plan.entity.ts`
- Modify: `backend/src/modules/bnpl/entities/bnpl-subscription.entity.ts`
- Create: `backend/scripts/migrations/20261019_shared_bnpl_plans.sql`

- [ ] Add nullable `organizationId` to subscriptions and make plan `organizationId` nullable.
- [ ] Write SQL to add the subscription organization column, backfill it from each subscription owner's `users.organization_id`, make plan organization nullable, and set existing plan organization IDs to `NULL`; preserve every ID and financial value.
- [ ] Review SQL for idempotency and constraints; verify null organization handling.

### Task 2: Shared plan list and management

**Files:**
- Modify: `backend/src/modules/bnpl/controllers/plans.controller.ts`
- Modify: `backend/src/modules/bnpl/services/plans.service.ts`
- Modify: `backend/src/database/seeds/seed-catalog.ts`
- Modify: `web/src/pages/bnpl-manager/Plans.tsx`
- Modify: `web/src/components/layout/Sidebar.tsx`
- Test: `backend/src/modules/bnpl/controllers/plans.controller.spec.ts`
- Test: `backend/src/modules/bnpl/services/plans.service.spec.ts`

- [ ] Add a failing test that individual plan listing returns active shared plans independent of the caller organization.
- [ ] Change plan queries and create/update behavior to use global plan rows (`organizationId: null`); seed demo plans as global.
- [ ] Restrict create, update, status changes, and version-history access to Super Admin; show the shared plan screen read-only to BNPL Managers.
- [ ] Add a failing test that non-approved/expired KYC cannot list individual plans, then enforce the existing KYC policy at the list boundary.
- [ ] Show a clear KYC-required error in the individual Catalog modal when the plans request is forbidden; do not report it as an empty plan list.
- [ ] Run focused controller/service tests.

### Task 3: Organization-aware eligibility and subscription lifecycle

**Files:**
- Modify: `backend/src/modules/bnpl/services/subscriptions.service.ts`
- Modify: `backend/src/modules/bnpl/services/processing-engine.service.ts`
- Test: `backend/src/modules/bnpl/services/subscriptions.service.spec.ts`
- Test: `backend/src/modules/bnpl/services/processing-engine.service.spec.ts`

- [ ] Add a failing test showing eligibility for the same global plan uses the requesting member's organization config and checks KYC.
- [ ] Store the user's `organizationId` on subscription creation and use it for config in eligibility, total calculation, disbursement, and installment dates/fees.
- [ ] Preserve null-organization defaults and verify them with a focused test.
- [ ] Run focused service tests.

### Task 4: Tenant-safe order reporting

**Files:**
- Modify: `backend/src/modules/bnpl/services/subscriptions.service.ts`
- Modify: `backend/src/modules/business-manager/business-manager.service.ts`
- Test: relevant BNPL/business-manager service specs.

- [ ] Add a regression test that an organization manager finds its subscriptions through `subscription.organizationId` after plans become global.
- [ ] Replace tenant filters on `plan.organizationId` with `subscription.organizationId` in order lookup and manager reporting.
- [ ] Run focused reporting tests.

### Task 5: Verify application

- [ ] Run the focused BNPL tests and backend build.
- [ ] Run the full backend suite and report pre-existing failures separately.
- [ ] Check `git diff --check` and review the SQL migration plus all plan organization filters.
