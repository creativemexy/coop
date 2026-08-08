# Coop BNPL — Project Cost Breakdown

> All figures in **Nigerian Naira (₦)** unless noted.  
> Exchange rate used: **$1 = ₦1,500** (2026 estimate).  
> Costs are for an MVP-to-production launch of a fintech app (BNPL + Savings + Loans + Investments + KYC).

---

## 1. One-Time Costs

### 1.1 Product Design (UI/UX)

| Item | Cost (₦) | Notes |
|---|---|---|
| User research & wireframes | 350,000 | 2 weeks |
| High-fidelity mobile + web UI design | 800,000 | ~40 screens |
| Design system & component library | 250,000 | Reusable tokens, colors, typography |
| Prototype & user testing | 200,000 | Figma interactive + 5 user tests |
| **Subtotal** | **1,600,000** | |

### 1.2 Software Development

| Item | Cost (₦) | Notes |
|---|---|---|
| Backend API (NestJS + PostgreSQL) | 3,500,000 | Auth, BNPL, Savings, Loans, KYC, Webhooks, Monitoring |
| Mobile app (React Native / Expo) | 3,500,000 | ~25 screens, navigation, state, API integration |
| Database schema & migrations | 500,000 | TypeORM entities, seeds, indexes |
| Security hardening | 800,000 | SSL pinning, biometrics, device attestation, XSS, rate limiting |
| Monitoring & alerting integration | 400,000 | Sentry, Slack alerts, logging |
| Payment gateway integration (Paystack + Korapay) | 600,000 | Charges, refunds, webhooks, KYC verification |
| **Subtotal** | **9,300,000** | |

### 1.3 Quality Assurance

| Item | Cost (₦) | Notes |
|---|---|---|
| Test case writing | 200,000 | Functional, regression, edge cases |
| Manual QA (backend + mobile) | 400,000 | 2 weeks, 1 QA engineer |
| Automated test scripts | 350,000 | Jest + Detox / Appium |
| Security audit / penetration test | 500,000 | OWASP top-10, API abuse testing |
| UAT with sample users | 150,000 | 5 users, 1 week |
| **Subtotal** | **1,600,000** | |

### 1.4 Launch & Compliance

| Item | Cost (₦) | Notes |
|---|---|---|
| Google Play Developer Account | 37,500 | $25, one-time fee |
| Apple Developer Program | 150,000 | $99/year, billed annually |
| CAC business registration (LTD/GTI) | 150,000 | Incorporation + business name |
| NDPR / data privacy registration | 100,000 | NITDA data protection compliance |
| Legal — privacy policy & TOS draft | 300,000 | Fintech-specific terms |
| **Subtotal** | **737,500** | |

### 1.5 One-Time Total

| Category | Amount (₦) |
|---|---|
| Design | 1,600,000 |
| Development | 9,300,000 |
| QA | 1,600,000 |
| Launch & Compliance | 737,500 |
| **TOTAL (one-time)** | **₦13,237,500** |

---

## 2. Recurring Monthly Costs

### 2.1 Cloud Hosting

| Item | Plan | Cost (₦) | Notes |
|---|---|---|---|
| App server (backend API) | DigitalOcean Basic Droplet, 2 vCPU / 4 GB RAM | 45,000 | ~$30/mo — runs NestJS + background workers |
| PostgreSQL database | DigitalOcean Managed DB, 1 vCPU / 2 GB RAM / 50 GB | 60,000 | ~$40/mo — automated backups, failover |
| Redis (cache + queues) | DigitalOcean Managed Redis, 256 MB | 22,500 | ~$15/mo — Bull queues, session cache |
| Object storage (uploads) | DigitalOcean Spaces, 250 GB | 15,000 | ~$10/mo — catalog images, KYC documents |
| CDN | Cloudflare Pro | 0 | Free tier sufficient for MVP |
| **Subtotal** | | **142,500** | |

> **Alternative:** AWS EC2 t3.medium (2 vCPU, 4 GB) + RDS db.t3.small ≈ ₦225,000/mo (more expensive but wider ecosystem).

### 2.2 Domain & DNS

| Item | Cost (₦) | Notes |
|---|---|---|
| Domain name (`.com` or `.com.ng`) | 3,000/yr → **250/mo** | Renewed annually |
| DNS (Cloudflare) | 0 | Free plan |
| **Subtotal** | **250** | |

### 2.3 Communication (SMS / OTP)

| Item | Cost (₦) | Notes |
|---|---|---|
| Transactional SMS (OTP, alerts) — 10,000/mo | ~70,000 | Termii / BulkSMS Nigeria @ ~₦7/SMS on DND route |
| Promotional SMS (marketing) — 5,000/mo | ~35,000 | Standard route @ ~₦7/SMS |
| WhatsApp Business API (optional) | 75,000 | Termii: $50/mo for WABA |
| **Subtotal** | **105,000 – 180,000** | Scales with volume |

### 2.4 Identity Verification (Korapay / KYC)

| Item | Cost (₦) | Notes |
|---|---|---|
| BVN verification | ~500/verification | Korapay pay-per-use |
| NIN verification | ~400/verification | Korapay pay-per-use |
| Phone number lookup | ~300/verification | Korapay pay-per-use |
| Estimated monthly (500 verifications) | 200,000 | ~₦400 avg × 500 |
| **Subtotal** | **200,000** | Scales with user growth |

### 2.5 Monitoring & Observability

| Item | Cost (₦) | Notes |
|---|---|---|
| Sentry (error tracking) | 0 – 30,000 | Free tier (5k events/mo) → Team plan ($19/mo) |
| Uptime monitoring (Better Stack / Pingdom) | 0 – 7,500 | Free tier → uptime checks + status page |
| APM (optional, e.g., Scout APM) | 0 – 30,000 | Can skip until scale |
| **Subtotal** | **0 – 67,500** | |

### 2.6 Mobile Infrastructure

| Item | Cost (₦) | Notes |
|---|---|---|
| Google Play Console | 0 | One-time only (already counted) |
| Apple Developer Program | 12,500 | $99/yr ÷ 12 (already counted above as annual) |
| App distribution (TestFlight / Internal testing) | 0 | Free for up to 100 testers |
| Push notifications (Expo Push / Firebase) | 0 – 30,000 | Free tier up to 1M pushes/mo |
| Crash reporting (Sentry) | Included in 2.5 | — |
| **Subtotal** | **12,500** | |

### 2.7 Staff / Maintenance

| Item | Cost (₦) | Notes |
|---|---|---|
| Backend maintenance & bug fixes | 300,000 | ~20 hrs/mo |
| Mobile maintenance & app store updates | 250,000 | ~15 hrs/mo |
| DevOps & infrastructure management | 150,000 | ~10 hrs/mo |
| Customer support (Level 1) | 200,000 | Part-time |
| **Subtotal** | **900,000** | |

### 2.8 Monthly Total

| Category | Amount (₦) |
|---|---|
| Cloud Hosting | 142,500 |
| Domain & DNS | 250 |
| SMS / Communication | 105,000 – 180,000 |
| KYC / Identity | 200,000 |
| Monitoring | 0 – 67,500 |
| Mobile Infrastructure | 12,500 |
| Staff / Maintenance | 900,000 |
| **TOTAL (minimum)** | **₦1,360,250** |
| **TOTAL (with growth scaling)** | **~₦1,502,750** |

---

## 3. Annual Costs

| Item | Cost (₦) | Notes |
|---|---|---|
| Domain renewal | 3,000 | `.com.ng` or `.com` |
| Apple Developer Program | 150,000 | $99/yr — required for App Store |
| CAC annual return filing | 20,000 | Late filing penalties apply |
| NDPR data audit (every 2 years) | 100,000 | NITDA requirement |
| Cloud hosting (12× monthly) | 1,710,000 | Based on ₦142,500/mo |
| SMS (12× monthly) | 1,260,000 – 2,160,000 | Based on 10k–15k msgs/mo |
| KYC (12× monthly) | 2,400,000 | Based on 500 verifications/mo |
| Maintenance (12× monthly) | 10,800,000 | Based on ₦900,000/mo |
| **TOTAL (annual recurring)** | **~₦16,443,000 – ₦17,343,000** | |

---

## 4. Payment Gateway & Transaction Fees

These are **variable costs** deducted from each transaction (not fixed fees).

| Item | Rate | Notes |
|---|---|---|
| Paystack — card payments | 1.5% + ₦100 | Per successful charge |
| Paystack — bank transfer | 1.5% + ₦100 capped at ₦2,000 | Flat cap |
| Korapay — payments | ~1.5% – 3% | Varies by channel (card, bank, mobile money) |
| Korapay — disbursements | ₦50 – ₦100 | Per payout |
| Korapay — identity | ₦300 – ₦500 | Per verification (BVN/NIN/phone) |
| Settlement timeline | T+1 (Paystack), T+1 (Korapay) | Standard |

> **Example:** If you process ₦10M in payments/month:
> - Paystack fees ≈ ₦250,000/mo (at 1.5% + ₦100 avg)
> - Korapay disbursements ≈ ₦50,000/mo (at 500 payouts)
> - **Total variable: ≈ ₦300,000/mo**

---

## 5. Summary

### 5.1 Go-To-Market Budget (First Year)

| Category | Amount (₦) |
|---|---|
| One-time (design + dev + QA + compliance) | 13,237,500 |
| Recurring (hosting + SMS + KYC + maintenance) × 12 | 16,323,000 – 18,033,000 |
| Variable (payment gateway fees — est.) | 3,600,000 |
| **FIRST YEAR TOTAL** | **~₦33,160,500 – ₦34,870,500** |

### 5.2 Monthly Run-Rate (Post-Launch)

| Category | Amount (₦) |
|---|---|
| Cloud & Infrastructure | 142,500 |
| SMS & Communications | 105,000 – 180,000 |
| KYC / Identity | 200,000 |
| Monitoring | 0 – 67,500 |
| Maintenance & Staff | 900,000 |
| Gateway fees (variable) | 300,000 |
| **MONTHLY TOTAL** | **~₦1,647,500 – ₦1,790,000** |

### 5.3 Potential Cost-Saving Measures

| Measure | Monthly Saving (₦) | Notes |
|---|---|---|
| Use Cloudflare free tier instead of Pro | 0 | Already free |
| Reduce SMS to transactional-only | 70,000 – 100,000 | Skip promotional SMS |
| Use self-hosted Sentry (self-managed) | 15,000 – 30,000 | More ops overhead |
| Downgrade DB to 1 GB RAM early-stage | 22,500 | Monitor query performance |
| Replace managed Redis with in-app memory | 22,500 | Only if queue volume is low |
| Outsource maintenance (freelance) | 300,000 – 400,000 | Instead of retainer staff |
| Use Firebase for push (free tier) | 15,000 – 30,000 | 1M free pushes/mo |
| **Total potential savings** | **~₦445,000 – ₦582,500/mo** | |

---

*Bill prepared July 2026. Prices subject to change based on provider updates, exchange rate fluctuations, and usage volume.*
