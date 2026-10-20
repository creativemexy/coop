# Plan: Bootstrap Admin Flow Completion

**Complexity**: Medium
**Estimated Effort**: 12-18 hours

## Summary
Complete the bootstrap admin initialization system that allows the first super admin to be created securely, configures platform-wide settings, and establishes the initial tenant hierarchy. Builds on the existing `BootstrapAdminService` and new test file.

## Patterns to Mirror

| Category | Source | Pattern |
|----------|--------|---------|
| Bootstrap Service | `backend/src/bootstrap-admin.service.ts` | Existing service with `ensureBootstrapAdmin()`, `isBootstrapComplete()` |
| Test Pattern | `backend/src/bootstrap-admin.service.spec.ts` | New test file - follow its structure for new tests |
| Settings Service | `backend/src/modules/settings/settings.service.ts` | Platform settings CRUD with typed getters (`getNumber`, `getBoolean`) |
| Admin Module | `backend/src/modules/admin/admin.module.ts` | Module structure with controllers, services, entities |
| Seeding Pattern | `backend/src/database/seeds/seed-*.ts` | Idempotent seed scripts with `DataSource` and `QueryRunner` |
| Health Checks | `backend/src/common/health/health.controller.ts` | `/health` endpoint pattern for readiness/liveness |
| Audit Logging | `backend/src/common/audit.service.ts` | `AuditAction` enum, structured metadata logging |

## Files to Change

| File | Action | Why |
|------|--------|-----|
| `backend/src/bootstrap-admin.service.ts` | UPDATE | Complete implementation: admin creation, platform config, tenant setup, idempotency |
| `backend/src/bootstrap-admin.service.spec.ts` | UPDATE | Comprehensive tests for all bootstrap scenarios |
| `backend/src/modules/admin/admin.controller.ts` | UPDATE | Add `POST /admin/bootstrap` endpoint (guarded, idempotent) |
| `backend/src/modules/admin/admin.service.ts` | UPDATE | Delegate to `BootstrapAdminService`, add status endpoint |
| `backend/src/modules/admin/admin.module.ts` | UPDATE | Ensure `BootstrapAdminService` provided/exported |
| `backend/src/common/health/health.controller.ts` | UPDATE | Add bootstrap status to health checks |
| `backend/src/main.ts` | UPDATE | Call bootstrap on app startup (conditional) |
| `backend/src/config/app.config.ts` | UPDATE | Add bootstrap-related config (enable/disable, secret) |
| `backend/.env.example` | UPDATE | Document `BOOTSTRAP_ADMIN_SECRET`, `BOOTSTRAP_ADMIN_EMAIL` |
| `web/src/pages/admin/BootstrapAdmin.tsx` | CREATE | Web UI for bootstrap flow (guarded by feature flag) |
| `web/src/stores/admin.store.ts` | CREATE | Zustand store for bootstrap state |
| `mobile/src/screens/admin/BootstrapAdminScreen.tsx` | CREATE | Mobile bootstrap screen (optional) |

## Tasks

### Task 1: Complete BootstrapAdminService Implementation
- **Action**: Implement `bootstrapAdmin(dto: BootstrapAdminDto)` creating: super admin user, default apex organization, platform settings (fees, KYC, maintenance), default notification templates, default policy templates, global risk rules; ensure idempotency (check `isBootstrapComplete()` first); wrap in transaction; audit log every step
- **Mirror**: Follow `AuthService.register()` for user creation (password hashing, virtual account); follow `SettingsService` for platform config; follow seed scripts for default data
- **Validate**: `npm run test -- bootstrap-admin.service.spec.ts`; manual test via `curl`

### Task 2: Add Bootstrap Admin Controller Endpoint
- **Action**: Add `POST /api/v1/admin/bootstrap` in `AdminController`; guard with `MaintenanceGuard` (allow during bootstrap) + custom `BootstrapGuard` (checks secret header); validate dto (email, password, org name, secret); return bootstrap status
- **Mirror**: Follow `AdminController` patterns (role guards, validation pipes); follow `AuthController` for password validation
- **Validate**: `curl -X POST -H "X-Bootstrap-Secret: <secret>" -d '{"email":"admin@coop.com","password":"...","orgName":"Coop"}' /api/v1/admin/bootstrap`

### Task 3: Bootstrap Guard & Configuration
- **Action**: Create `BootstrapGuard` checking `X-Bootstrap-Secret` header against `BOOTSTRAP_ADMIN_SECRET` env; only allow if `isBootstrapComplete() === false`; add config to `app.config.ts`; update `.env.example`
- **Mirror**: Follow `MaintenanceGuard` pattern (settings check, allowed paths); follow `SseAuthGuard` for header validation
- **Validate**: Request without secret → 401; request after bootstrap → 403; valid request → 200

### Task 4: Health Check Integration
- **Action**: Add `bootstrapComplete: boolean` to health response; add `bootstrapRequired: boolean` for readiness probe; super_admin sees full details, others see minimal
- **Mirror**: Follow `HealthController` pattern (liveness vs readiness); follow `MonitoringService` for structured health data
- **Validate**: `curl /api/v1/health` shows bootstrap status; Kubernetes readiness probe works

### Task 5: Startup Bootstrap Trigger (Optional)
- **Action**: In `main.ts`, if `BOOTSTRAP_ADMIN_EMAIL` and `BOOTSTRAP_ADMIN_PASSWORD` env vars set AND bootstrap not complete → auto-bootstrap on startup; log clearly; never auto-bootstrap in production without explicit opt-in
- **Mirror**: Follow `AppModule.onModuleInit()` pattern (encryption init); follow `SchedulerModule` for deferred startup tasks
- **Validate**: Set env vars, start backend, verify admin created in logs

### Task 6: Web Admin Bootstrap UI
- **Action**: Create `BootstrapAdmin.tsx` page (only accessible if bootstrap incomplete + feature flag); form with email, password, org name, secret; show progress steps; redirect to login on success; integrate into admin routes
- **Mirror**: Follow `web/src/pages/auth/Register.tsx` form pattern; follow `AppLayout.tsx` for protected routes; use `react-hook-form` + `zod` validation
- **Validate**: Navigate to `/admin/bootstrap` before bootstrap → shows form; after bootstrap → 404/redirect

### Task 7: Default Platform Configuration Seeding
- **Action**: Ensure bootstrap creates: registration fee (configurable), default KYC provider config, fee distribution percentages, SMS/email templates, global risk rules (velocity, amount limits), feature flags (BNPL, savings, loans, investments enabled)
- **Mirror**: Follow `seed-global-risk-rules.ts`, `seed-notification-templates.ts`, `seed-policy-templates.ts` patterns; use `SettingsService.setValue()`
- **Validate**: After bootstrap, all settings have sensible defaults; `GET /api/v1/settings` returns them

### Task 8: Tests & Documentation
- **Action**: Expand `bootstrap-admin.service.spec.ts`: happy path, duplicate bootstrap, invalid secret, partial failure rollback, missing env vars; add e2e test in `test/bootstrap.e2e-spec.ts`; document in `host.md` and `README.md`
- **Mirror**: Follow existing test patterns in `backend/src/modules/**/*.spec.ts`; follow `host.md` deployment docs style
- **Validate**: All tests pass; docs updated

## Validation

```bash
# Backend tests
cd backend && npm run test -- bootstrap-admin.service.spec.ts
cd backend && npm run test:e2e -- bootstrap.e2e-spec.ts

# Manual bootstrap flow
cd backend && BOOTSTRAP_ADMIN_SECRET=test123 npm run start:dev &
curl -X POST -H "X-Bootstrap-Secret: test123" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"SecurePass123","orgName":"Test Coop"}' \
  http://localhost:3001/api/v1/admin/bootstrap

# Verify health check
curl http://localhost:3001/api/v1/health | jq '.bootstrapComplete'

# Web UI test (if implemented)
# 1. Start web: cd web && npm run dev
# 2. Navigate to /admin/bootstrap
# 3. Complete form, verify redirect to login
# 4. Login with created credentials
```

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Accidental bootstrap in production | Low | Secret required, env var opt-in for auto-bootstrap, idempotent |
| Partial failure leaves inconsistent state | Medium | Transaction wrapper, audit log for debugging, idempotent retry |
| Secret leakage | Medium | Rotate secret after bootstrap; warn in logs if default used |
| Race condition concurrent bootstrap requests | Low | Database-level lock (advisory lock) or `SELECT FOR UPDATE` on settings |

## Acceptance
- [ ] `BootstrapAdminService.bootstrapAdmin()` creates super admin, apex org, all default config
- [ ] Idempotent: running twice returns success, no duplicates
- [ ] `POST /admin/bootstrap` endpoint guarded, validated, documented
- [ ] Health check exposes bootstrap status for orchestration
- [ ] Web UI allows guided bootstrap (feature-flagged)
- [ ] All default platform settings seeded correctly
- [ ] Tests cover happy path, error cases, idempotency
- [ ] Documentation updated in `host.md` and `README.md`