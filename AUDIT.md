# Repo audit

What this repo does: This is a multi-app fintech platform for BNPL and member finance: a NestJS API, a React web console, and an Expo mobile app. The repo is trying to cover a full cooperative finance stack with auth, KYC, savings, loans, investments, payments, and admin tooling.

Assumed load: I assumed a small-to-medium fintech product with a few hundred to a few thousand active members, not a giant multi-country consumer app. The code is structured for a single app instance with Postgres and role-based UI, not a massive horizontally scaled payment system yet.

## Must fix

1. **The test suite is not healthy right now** (`backend/src/modules/dashboard/dashboard.service.spec.ts:1-120`)
   - **What this is:** The backend Jest suite includes a dashboard spec that fails during Nest dependency injection.
   - **Problem:** The test registers only a subset of the real service dependencies, so the suite cannot prove the platform is stable. The current failure is not a business logic assertion; it is a broken test harness, which means CI is not protecting the app.
   - **Fix:** Add the missing providers or create a focused test module that matches the real `DashboardService` constructor. Run the suite in CI and keep it green before shipping code.
   - **If we skip it:** Regressions in core dashboard logic, auth, and financial summaries will be missed until production breaks.

2. **The repo is shipping very weak default secret material in checked-in config** (`backend/.env.example:1-72`, `backend/src/config/jwt.config.ts:1-18`)
   - **What this is:** The example environment file contains generic default values like `DB_PASSWORD=postgres` and placeholders for JWT keys, and the config code refuses to boot if the JWT secrets are missing.
   - **Problem:** This is fine for local development, but not safe as a production pattern. It makes accidental deployment easy and encourages copy-paste secrets into real environments. The app is also hardcoded to fail early if secret values are not set, which is correct, but the repo is not forcing a safe secret-management story.
   - **Fix:** Remove all real-looking defaults from production templates, require explicit secrets from the environment or a secrets manager, and keep a clearly dev-only env template separate from production guidance.
   - **If we skip it:** A production deployment can easily pick up weak defaults or leak config values into the wrong environment.

3. **The codebase is broad but the test evidence does not cover the money path** (`backend/src/modules/bnpl`, `backend/src/modules/ledger`, `backend/src/modules/payments`, `backend/src/modules/kyc`)
   - **What this is:** The repo implements BNPL, ledgering, KYC, and payment flows as many separate modules.
   - **Problem:** This is exactly the kind of system where bugs are expensive. I did not find strong end-to-end checks protecting the path from KYC approval to subscription creation to payment posting and ledger balancing. The suite appears to be mostly service-level and partial.
   - **Fix:** Add a small set of integration tests around the core financial path: registration, KYC approval, installment creation, payment success, and ledger posting.
   - **If we skip it:** The platform can silently record the wrong balances or approve the wrong lifecycle state and only discover it during finance review.

## Should fix

4. **The front-end bundle is too heavy for a first-load app** (`web/src/App.tsx:1-322`, `web/package.json:1-31`)
   - **What this is:** The web app imports a very large route tree in a single file and builds as a single large JS bundle.
   - **Problem:** The Vite build warns that chunks are larger than 500 kB. This is a real load issue for a role-heavy admin console and a bad pattern for a finance product where users may be on weak mobile networks.
   - **Fix:** Split routes by role and lazy-load pages with `React.lazy` or route-level code splitting. Keep the app shell small and pull heavy dashboards on demand.
   - **If we skip it:** Initial load gets slower, mobile users get a worse experience, and the app starts to feel more like a monolith than a product.

5. **The repo has a big amount of feature surface with no obvious single source of truth for policy and permissions** (`web/src/App.tsx`, `backend/src/app.module.ts`, `backend/src/common/guards`)
   - **What this is:** The app contains a large number of role-based modules and guard files.
   - **Problem:** In a BNPL platform, access control and tenant isolation are critical. A large surface area with many role screens is easy to get wrong. I did not see a single central policy map that clearly connects roles, pages, and data scope.
   - **Fix:** Define the effective permission model in one place and make route and service checks reference that contract instead of re-implementing guard logic in multiple places.
   - **If we skip it:** Access errors show up late and are expensive to fix once the product is live.

6. **The repo is a large product, but the tooling is still in the “prototype / internal build” pattern** (`README.md:1-170`, `backend/package.json:1-86`, `mobile/package.json:1-47`, `web/package.json:1-31`)
   - **What this is:** The repo is clearly ambitious and the stack is modern, but the package setup still looks more like a project in active development than a hardened product.
   - **Problem:** This is not a code defect by itself, but it is a risk indicator. There are multiple apps, many modules, and no clear production release gate documented in the repo beyond “do not put real data in this.”
   - **Fix:** Add a release checklist, required env validation, migration policy, and a single deployment health check across the three apps.
   - **If we skip it:** The app can work locally and still fail in the real world once real money, customer data, or provider callbacks are involved.

## Nice to have

7. **There are many modules, and some of the code structure is heavy without clear load-based slicing** (`backend/src/app.module.ts`, `backend/src/modules`)
   - **What this is:** The backend module registration imports a large list of features into one app.
   - **Problem:** That is not wrong, but it makes maintenance harder and increases the chance of unrelated coupling. It is a code organization issue more than a bug.
   - **Fix:** Split the app by domain boundaries and keep shared utilities in a small common layer.
   - **If we skip it:** The codebase will become harder to reason about as the product grows.

Verdict: Good ambition and a strong platform shape, but the repo is not ready to trust with production operations yet. The first things to fix are the broken test suite, the insecure default config pattern, and the lack of end-to-end protection around the financial workflow.

Lean: -0 lines, -0 dependencies possible.

Not checked: I did not read every generated seed file, every route page, or every provider integration in depth. I did validate the repo shape, build health, and the current backend test signal. I also did not run the Expo app in a simulator or app store build, so the mobile app’s runtime behavior was not fully exercised here.
