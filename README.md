# Coop BNPL

Coop BNPL is a multi-tenant cooperative finance platform for buy-now-pay-later (BNPL), savings, loans, investments, payments, KYC, and member support.

The repository contains a NestJS API, an Expo React Native mobile app, and a React/Vite web console.

## Repository Structure

```text
backend/  NestJS API, PostgreSQL/TypeORM persistence, auth, payments, ledger, KYC, and services
mobile/   Expo React Native member application for iOS and Android
web/      React/Vite browser console for administration and operations
```

## Core Capabilities

- JWT authentication with refresh tokens, role-based access control, and tenant isolation
- Cooperative, apex organization, business manager, accountant, BNPL manager, admin, and member roles
- BNPL catalog, plans, subscriptions, installments, and payment workflows
- Double-entry ledger with fee distribution and immutable audit records
- Savings, loans, investments, virtual accounts, notifications, and support tickets
- KYC integrations through Korapay and payment processing through Paystack
- SMS and email integrations, retention jobs, health checks, throttling, and monitoring
- Real-time support and notification updates

## Technology Stack

- **Backend:** Node.js 20+, TypeScript, NestJS 11, TypeORM, PostgreSQL
- **Mobile:** Expo 54, React Native 0.81, React 19, React Navigation, Zustand
- **Web:** React 19, TypeScript, Vite, React Router, Tailwind CSS, Zustand

## Prerequisites

- Node.js 20 or newer
- npm 10 or newer
- PostgreSQL 14 or newer
- Xcode and CocoaPods for iOS development
- Android Studio and an Android SDK for Android development
- Expo tooling for mobile development

## Quick Start

Clone the repository and install dependencies in each application:

```bash
git clone git@github.com:creativemexy/coop.git
cd coop

cd backend && npm install
cd ../mobile && npm install
cd ../web && npm install
```

### 1. Start the backend

Create the backend environment file and configure PostgreSQL:

```bash
cd backend
cp .env.example .env
npm run start:dev
```

The API listens on `http://localhost:3001` by default. The default database configuration expects:

```text
Host: localhost
Port: 5432
Database: coop_bnpl
User: postgres
Password: postgres
```

Create the database before starting the API if it does not already exist:

```bash
createdb coop_bnpl
```

For local development, `DB_SYNCHRONIZE=true` can create/update the schema automatically. Use migrations and a managed secret store for production deployments.

### 2. Start the web console

```bash
cd web
npm run dev
```

Open the Vite URL shown in the terminal, normally `http://localhost:5173`. The web client uses the Vite proxy and calls the API under `/api/v1`.

### 3. Start the mobile app

Set the API URL for the device or emulator, then start Expo:

```bash
cd mobile
EXPO_PUBLIC_API_URL=http://localhost:3001 npm start
```

For a physical device, replace `localhost` with the host machine's LAN IP address. Use `npm run android`, `npm run ios`, or `npm run web` to launch a specific target.

## Environment Configuration

The complete backend template is in [backend/.env.example](backend/.env.example). Important settings include:

| Variable | Purpose |
| --- | --- |
| `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME` | PostgreSQL connection |
| `DB_SYNCHRONIZE` | Schema synchronization for local development |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | Token signing secrets |
| `ENCRYPTION_KEY` | AES-256-GCM application encryption key |
| `CORS_ORIGINS` | Comma-separated web origins allowed by the API |
| `PAYSTACK_SECRET_KEY` | Paystack payment integration |
| `KORAPAY_SECRET_KEY` | KYC and identity verification integration |
| `TERMII_API_KEY` | SMS integration |
| `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` | Email delivery |
| `FEE_*_PERCENT` | Fee distribution configuration |

Do not commit `.env` files, production credentials, private keys, or payment-provider secrets. Replace all development defaults before deploying.

## Useful Commands

### Backend

```bash
cd backend
npm run start:dev    # Watch mode
npm run build        # Production build
npm test             # Unit tests
npm run test:e2e     # End-to-end tests
npm run test:cov     # Coverage report
npm run seed         # Seed development data
```

### Web

```bash
cd web
npm run dev          # Vite development server
npm run build        # Type-check and production build
npm run lint         # Oxlint
npm run preview      # Preview production build
```

### Mobile

```bash
cd mobile
npm start            # Expo development server
npm run android      # Android
npm run ios          # iOS
npm run web          # Expo web target
```

## API Overview

The API is versioned under `/api/v1`. Main resource groups include:

- `/auth` - registration, login, refresh, logout, and CSRF token handling
- `/users`, `/organizations`, `/apex-organizations` - users and tenancy
- `/bnpl` - catalog, plans, subscriptions, and installments
- `/payments` - payment initiation and provider webhooks
- `/ledger` - accounts, journal entries, and fee pots
- `/kyc` - identity verification and status
- `/dashboard` - role-specific operational summaries
- `/notifications`, `/support`, `/savings`, `/loans`, and `/investments`

## Development Notes

- Seed data is intended for development and testing only.
- Payment, KYC, SMS, and email providers can run in stub/fallback mode when credentials are not configured.
- Keep `DB_SYNCHRONIZE` disabled in production and apply reviewed migrations instead.
- Configure HTTPS, secure JWT/encryption secrets, restricted CORS origins, webhook signature validation, backups, and monitoring before launch.

## Project Status

This project is under active development. Product, compliance, security, and provider-integration requirements should be reviewed before using it with real customer funds or personally identifiable information.

## License

The project is currently marked as private and unlicensed in its application packages. Contact the repository owner for usage and contribution terms.
