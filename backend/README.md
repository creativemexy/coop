# Coop BNPL — Cooperative Buy-Now-Pay-Later Platform

Multi-tenant BNPL platform for cooperatives with fee sharing, double-entry ledger, KYC integration, and role-based access control.

## Architecture

```
backend/     — NestJS 11 + TypeORM + PostgreSQL API
mobile/      — Expo React Native app (auth + catalog + subscriptions)
```

### Backend Stack
- **Runtime**: Node.js, TypeScript 5.7 (strict)
- **Framework**: NestJS 11, Passport JWT
- **Database**: PostgreSQL via TypeORM 1.x (synchronize mode)
- **Integrations**: Paystack (payments), Korapay (KYC), Termii (SMS)

## Backend Setup

### Prerequisites
- Node.js >= 20
- PostgreSQL >= 14
- npm >= 10

### Quick Start

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database credentials
npm run start:dev
```

### Seed Data

```bash
npm run seed
```

Seeds in order: super admin → business manager → chart of accounts → demo data (apex org, org, admin, individual, BNPL manager, accountant)

### Test

```bash
npm test           # Unit tests (28 tests across 7 suites)
npm run test:e2e   # E2E tests (requires DB connection)
npm run test:cov   # Coverage report
```

## API Endpoints

| Prefix | Module | Auth |
|--------|--------|------|
| `POST /api/v1/auth/register` | Registration | Public |
| `POST /api/v1/auth/login` | Login | Public |
| `POST /api/v1/auth/refresh` | Token refresh | Public |
| `POST /api/v1/auth/logout` | Logout | JWT |
| `GET|POST|PATCH /api/v1/users` | User management | JWT + Roles |
| `GET|POST|PATCH /api/v1/apex-organizations` | Apex orgs | SUPER_ADMIN |
| `GET|POST|PATCH /api/v1/organizations` | Organizations | JWT + Roles |
| `GET|POST|PATCH /api/v1/bnpl/catalog` | Catalog items | JWT + Roles |
| `GET|POST|PATCH /api/v1/bnpl/plans` | Repayment plans | JWT + Roles |
| `POST|GET /api/v1/bnpl/subscriptions` | Subscriptions | JWT + Roles |
| `GET /api/v1/bnpl/installments/subscription/:id` | Installments | JWT |
| `POST /api/v1/bnpl/installments/:id/pay` | Mark paid | ACCOUNTANT |
| `POST /api/v1/payments/initiate` | Initiate payment | INDIVIDUAL |
| `POST /api/v1/payments/webhook/paystack` | Paystack webhook | Public |
| `GET|POST /api/v1/ledger/accounts` | Chart of accounts | JWT + Roles |
| `GET|POST /api/v1/ledger/journal-entries` | Journal entries | JWT + Roles |
| `GET /api/v1/ledger/fee-pots` | Fee pots | JWT + Roles |
| `POST /api/v1/kyc/initiate` | KYC initiation | JWT |
| `GET /api/v1/kyc/status` | KYC status | JWT |
| `GET /api/v1/dashboard/*` | Role dashboards | JWT + Roles |

## Roles

| Role | Scope |
|------|-------|
| `super_admin` | Global |
| `admin` | Apex org |
| `accountant` | Organization |
| `business_manager` | Global |
| `bnpl_manager` | Organization |
| `individual` | Self |

## Modules

### Auth & Users
JWT access + refresh token auth with bcrypt password hashing. Registration creates INDIVIDUAL role by default.

### Tenancy
ApexOrganization → Organization → User hierarchy. `TenantScopeGuard` enforces data isolation based on role.

### BNPL Core
- **Catalog**: Items with org-level eligibility restrictions
- **Plans**: Repayment plans linked to catalog items (down payment %, installment count, frequency, interest)
- **Subscriptions**: User subscriptions with automatic installment schedule generation
- **Installments**: Track payment status, mark as paid

### Payments
Paystack integration for payment initiation and webhook handling with HMAC signature verification. Processing fee (1.5%) computed on initiation.

### Ledger
Double-entry accounting system:
- Chart of accounts (11 system accounts seeded)
- Journal entries with balance validation and account existence checks
- Fee share computation (BM/platform/org/apex splits configured via env vars)
- Immutable fee share ledger + fee pot crediting

### KYC & SMS
Korapay identity verification and Termii SMS dispatch. Both fall back to stub mode when API keys are absent.

### Dashboard
Role-specific aggregation endpoints returning real-time counts and sums.

## Env Configuration

See `.env.example` for all variables. Key settings:

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_HOST` | localhost | PostgreSQL host |
| `DB_SYNCHRONIZE` | true | Auto-sync schema (dev only) |
| `JWT_ACCESS_SECRET` | — | JWT signing key |
| `PAYSTACK_SECRET_KEY` | — | Paystack API key |
| `KORAPAY_SECRET_KEY` | — | Korapay API key |
| `TERMII_API_KEY` | — | Termii API key |
| `FEE_BM_PERCENT` | 0.20 | Business manager fee share |

## Mobile

```bash
cd mobile
npm install
npx expo start
```

Built with Expo 52, React Navigation 7, Zustand 5, and axios with automatic JWT refresh.
