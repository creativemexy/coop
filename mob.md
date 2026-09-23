# FENAC Member App — Android & iOS Mobile Design

**Version:** 1.0 · **Platforms:** iOS (HIG) + Android (Material 3) · **Engine:** React Native / Expo (single codebase, platform-aware)

This document is the design bible for the member mobile app (`mobile/`). It replaces the current cold-blue palette with the warm, editorial "co-op premium" language already shipped in the web app, expressed natively for both iOS and Android.

---

## 1. Design Principles

1. **Warm over sterile.** Cream surfaces, deep green anchors, gold warmth. The app should feel like a trusted people's bank, not a cold neobank.
2. **The number is the hero.** Money is large, ligature-optically balanced, and never walled inside a chart if a clean figure says more.
3. **One system, two dialects.** A single token set; iOS gets softer, airier chrome; Android gets firmer Material structure. Never mix the dialects on one screen.
4. **Clarity beats clever.** Every screen has one primary action. Text never shrinks below comfortable mobile size.
5. **Trust is explicit.** Biometrics, masked numbers, confirmation flows, and calm status language on every money move.
6. **Empty states are designed.** There is no such thing as a blank list.

---

## 2. Platform Strategy

| Concern | iOS | Android |
|---|---|---|
| Navigation root | Bottom **tab bar** (4 tabs), native stack push | Bottom **navigation rail**-style bar / M3 bottom bar (4 destinations), push with back-gesture |
| Headers | Large title that collapses to small title; no app bar tint — cream bleeds behind | M3 **top app bar** (small), cream surface, status bar overlay |
| Back | Left chevron + edge-swipe gesture | Up arrow + system back (gesture/button) |
| Sheets & menus | iOS sheet (bottom, rounded 20, grabber, `presentationDetents`) | M3 **bottom sheet** + modal dialogs (corner 28) |
| FAB / primary action | Single pill CTA pinned in flow content | M3-style primary button, optionally a floating action for savings deposit |
| Haptics | `UIImpactFeedback`-style light/medium on selection, success | Android vibration pattern on confirm, subtle tick |
| Secure entry | Face ID / Touch ID via `LocalAuthentication`, AutoFill passcode | BiometricPrompt (fingerprint/face) |
| Text entry | Floating-label style fields, `textContentType` correctness | M3 outlined fields with helper text |
| Dark mode | System-driven, warm-tinted night variant | System-driven, same tokens |
| Type | SF Pro (system) | Roboto / system, M3 type ramp |

**Rule:** all logic, data, endpoints, and tokens are shared. Only chrome, spacing feel, and interaction paradigms differ per platform.

---

## 3. Brand & Color

### 3.1 Light palette (replaces `theme.ts` `colors`)

| Token | Hex | Role |
|---|---|---|
| `bg` | `#FFF9EF` | App background (cream) — replaces `#F6F8FB` |
| `surface` | `#FFFFFF` | Cards, sheets, headers |
| `surface_warm` | `#FFF3E2` | Tinted cards (balances, promo) |
| `surface_hint` | `#F0DDAD33` | Soft gold wash behind featured tiles |
| `ink` | `#23150F` | Primary text — replaces `#122033` |
| `ink_soft` | `#2C1B13` | Secondary emphasis |
| `muted` | `#6B5245` | Secondary text, labels — replaces `#627084` |
| `faint` | `#A98F78` | Disabled / tertiary |
| `border` | `#E7DCCB` | Hairlines — replaces `#E2E8F0` |
| `border_soft` | `#EDE2D3` | Section dividers |
| `chip` | `#EDE2D3` | Neutral chip fill |
| `brand` | `#176B5B` | Primary green — replaces `#0B3B60` |
| `brand_deep` | `#0F5A4B` | Pressed/hover green |
| `brand_soft` | `#176B5B1A` | 10% green wash (icons-on-tile) |
| `gold` | `#B79B6B` | Eyebrows, ornament, loyalty — replaces accent `#0F766E` |
| `gold_bright` | `#E4A42A` | Highlights, attention |
| `gold_hint` | `#F7D674` | Confetti marks, light accents |
| `rust` | `#9D4824` | BNPL / second brand accent |
| `rust_deep` | `#B85A38` | Pressed rust |
| `success` | `#176B5B` | Paid, confirmed — replaces `#15803D` |
| `warning` | `#B45309` | Due soon, pending review — replaces `#B45309` |
| `danger` | `#B3261E` | Overdue, declined — replaces `#B42318` |
| `white` | `#FFFFFF` | On-brand text on green/rust/ink |

### 3.2 Dark palette

| Token | Hex | Notes |
|---|---|---|
| `bg` | `#151411` | Warm near-black, not cool navy |
| `surface` | `#211E1A` | |
| `surface_warm` | `#2A241C` | |
| `ink` | `#F5EBDD` | |
| `muted` | `#C9B89F` | |
| `border` | `#3A3228` | |
| `brand` | `#2E8C76` | Brighter green on dark |
| `brand_soft` | `#2E8C7626` | |
| `gold` | `#D3B98A` | |
| `rust` | `#C0703F` | |
| `danger` | `#FF6B5E` | |

### 3.3 Usage rules

- **Green = money owned** (balance, savings, deposit). **Rust = money owed** (BNPL, loan balance, repayments). **Gold = loyalty, premiums, ornament.** **Red = overdue/declined only.**
- One saturated accent per screen block. Never brand-green + rust as equal siblings; differentiate by tint wash (`brand_soft` / `10% rust`) so hierarchy stays calm.
- Text on green/rust/ink uses pure `#FFF9EF`-white; never black.
- Buttons, ratings, and rewards glow less than the web — mobile chrome stays quieter; the money does the talking.

---

## 4. Typography

### 4.1 iOS (SF Pro, system)

| Role | Size | Weight | Tracking |
|---|---|---|---|
| Large title | 34 | Heavy / Black (−0.02) | Display numerals |
| Title 1 | 28 | Heavy (−0.02) | Screen headers |
| Title 2 | 22 | Bold (−0.01) | Card titles |
| Headline | 17 | Semibold | Section |
| Body | 15 | Regular | Copy, amounts secondary |
| Caption | 13 | Regular | Field labels/help |
| Eyebrow | 11 | Bold | UPPERCASE +0.12, always `gold` or `muted` |
| Amount (display) | 40 | Black (−0.03) | Home hero, tabular numerals |

### 4.2 Android (Roboto / system, M3 ramp)

| Role | Size | Weight | Notes |
|---|---|---|---|
| Headline | 28 | Bold | Small app bar titles |
| Title | 22 | Semibold | Cards |
| Body | 16 | Regular | Standard tap targets |
| Label | 14 | Medium | Buttons/labels |
| Eyebrow | 11 | Bold | UPPERCASE +0.12 |

### 4.3 Rules

- Money always left-aligned, tabular figures, never center-justified inside cards.
- Numerals use dark variant (old-style look disabled); keep digits stable across loading (monospace-ish via font-variant `tabular-nums`).
- Minimum readable body 13 iOS / 14 Android. No text smaller than 11 except legal microcopy.
- Respect `fontScale` for dynamic type; never clip.

---

## 5. Spacing, Radius, Elevation

- **Grid:** 8pt base (current `spacing` map stays valid; add `xxl2: 36`, `pagePad: 20`).
- **Radius:** cards 16, sheets 20 (iOS) / 28 (M3), inputs 12, chips 999, amount tiles 20, image cards 16.
- **Touch targets:** ≥ 48pt (current `layout.touchTarget`). Icon-only hit areas padded to 48 with visible 40pt glyph.
- **Elevation / shadows:**

| Surface | iOS | Android |
|---|---|---|
| Resting card | `shadowOpacity 0.05, r 8, y 1` | `elevation 1` |
| Raised (sheet, FAB) | `shadowOpacity 0.12, r 16, y 6` | `elevation 4` |
| Modal | dim 32% `#23150F` | dim 40% + scrim |

- **Never** stack more than two nested cards (card-in-card). Prefer flat tint `surface_warm` for secondary grouping.

---

## 6. Components

### 6.1 Amount card (hero)
- Cream `surface_warm`, radius 20, inset gold eyebrow, huge black figure, trailing "•••" for masked visibility toggle.
- Variants: **owned** (green eyebrow / green icon), **owed** (rust eyebrow / rust icon), **loyalty** (gold eyebrow).
- No border, one soft shadow. Content padding 20.

### 6.2 Buttons
| Variant | Fill | Label |
|---|---|---|
| `primary` | brand green pill, radius 999 | `#FFF9EF`, semibold |
| `secondary` | white, 1px `border`, radius 999 | `ink_soft` |
| `ghost` | transparent | `brand` |
| `rust` | rust pill | `#FFF9EF` |
| `danger` | danger pill | white |
| `gold` (merit) | gold_bright pill | `#23150F` |
- Full width on money-flow screens. Pressed state = `brand_deep` / scale 0.98 with light haptic.
- iOS: legs of text-inside-button keep the pill. Android: allow M3 standard-height 40dp with 48dp touch.

### 6.3 Inputs
- Cream surface, 1px `border` `#E7DCCB`, radius 12, label above (13 semibold, `muted`), helper + error below (`danger`, small).
- Focus: 1.5px `brand` border + soft brand ring. Money fields right-align the number, tabular.
- iOS: `textContentType` for OTP/passwords/credit-card to feed AutoFill. Android: `inputMode` correct per field.

### 6.4 Chips & status pills
- Neutral `chip` fill + `ink_soft` text; status pills get dot + tint:
  - `success` → green dot on `brand_soft`
  - `pending` → gold dot on gold 10%
  - `overdue/declined` → danger dot on danger 10%
  - `info` → cream + `border`
- Always include a text label next to status — never a bare dot alone.

### 6.5 Empty states
- Centered: 64pt icon tile in `brand_soft` (or rustic for owed lists) + title + one-line reassurance + primary CTA. No decorative illustration beyond the icon glyph; keep calm.
- Example: "No repayments due — you're all clear."

### 6.6 Bottom sheet (iOS sheet / M3 modal-bottom-sheet)
- Header eyebrow + title, grabber on iOS, 20 top padding, safe-area bottom padding, primary CTA pinned in sheet. Drag-dismissable iOS; Android uses explicit "Cancel" as secondary.
- Used for: deposit/withdraw quick actions, payment methods, plan selection, filters, confirmations.

### 6.7 Toast & inline banners
- Toast: dark ink pill, 48 tall, bottom above tab bar, auto-dismiss 3.5s, success/warning/danger icon left.
- Inline: full-width tinted banner under header for KYC incomplete, overdue, reconnect.

### 6.8 Tab bar / bottom navbar
- iOS: 4 tabs — **Home · Shop · Plans · Account**. Icon+label, active = `brand` icon fill + color, inactive `muted` outline. Frosted surface; no badges except notifications dot.
- Android: Material "bottom bar" with 4 destinations; active pill indicator behind icon (M3), active = brand.
- Icons: Ionicons (in use) but set active weight **filled**, inactive **outline** for consistency; prefer custom-feel set over generic.

### 6.9 Skeletons
- Cream-grey shimmer (`#EDE2D3` → `#E7DCCB`) only while real data is loading; amounts skeleton = tabular placeholder bars shaped like the digits.

---

## 7. Navigation & Screen Map

### 7.1 Reflow (from `AppNavigator.tsx`)

```
Unauthenticated: Login -> Register -> RegistrationFee -> Terms -> ForgotPassword
Authenticated tabs:
  Home (HomeStack)        Home -> KYCVerification
  Shop  (CatalogStack)    Catalog -> PlanSelection
  Plans (SubStack)        Subscriptions -> SubscriptionDetail -> PaymentWebView -> PaymentHistory
  Account (ProfileStack)  Profile -> Savings|Loans|Repayments|Notifications|PaymentMethods|Transactions|ActivityLog|SupportTickets|Investments|Portfolio|Distributions|Redemptions|PaymentHistory|KYCVerification|OnboardingTour|Rewards
```

### 7.2 New top-level destinations (add to Account stack)
- **OnboardingTour** — first-run, 3 screens, warm editorial.
- **Rewards** — merit points (gold identity).

### 7.3 Rules
- Money flows (pay, withdraw, invest, repay) are pinned bottom-sheet confirmations, then full-screen native push for the payment webview.
- After payment success: return to the started tab, show success toast + haptic, refresh balances.
- Back-swipe should not abort an in-flight payment without a confirm sheet.

---

## 8. Screen-by-Screen Design

### 8.1 Auth
- **Login:** cream background; brand glyph tile (green, gold emblem); huge "Welcome back" Title 1 with eyebrow "FENAC Cooperative"; email + password, "Forgot password?" link left; primary pill "Sign in" full-width; divider "or"; Apple sign-in (iOS) / Google (Android); Register text link under. Biometrics toggle after successful login.
- **Register:** stepper header (1 Profile · 2 Fee · 3 Done), fields grouped by card, fee preview card (`surface_warm`) before finishing. **RegistrationFee:** fee amount card + "Pay registration fee" as primary. **Terms:** native scroll with Checklist-17-style list, acceptance CTA bottom. **ForgotPassword:** single field, success state = centered check on brand tile.

### 8.2 Home
- Header: greeting eyebrow ("Good morning"), Name Title 1, avatar tile right; notification bell with gold dot.
- Hero **Amount card**: "Total balance", tabular figure, visible/hide toggle.
- Quick actions row (2×2 or 4-up, icon tiles in `brand_soft`/tints): **Deposit · Pay · Shop · Token**(rewards/Loyalty).
- Balanced section stack:
  1. **Savings tile** (green) — balance, small trend, chevron.
  2. **BNPL tile** (rust tint) — outstanding + next due date.
  3. **Loans tile** (green soft) — balance + next repayment.
- Banner strip: KYC incomplete / overdue → gold or danger tinted inline banner.
- Section: **Recent activity** (last 3, icon-left rows, amount right, status pill), footer "View all".
- Home stays scrollable, airy; no more than 3 tiles of the old box-in-box dashboard.

### 8.3 Shop (Catalog)
- Search pill below header; category eyebrow filter chips (horizontal, single-select, `brand` when active).
- Product cards: image 4:3 radius 16, name Headline, merchant caption, price bold, "BNPL" rust pill if eligible.
- **PlanSelection:** sheet with 2–3 plan rows (logo/tier, installment count, weekly amount, total); selected row = green ring; "Continue" pinned.

### 8.4 Plans (Subscriptions)
- Summary strip: paid this month / outstanding, next auto-debit.
- Subscription cards with status pills; overdue card raises inline danger banner + "Pay now" rust button.
- **SubscriptionDetail:** header card (merchant, cycle, status), installments table (list rows: due date, amount, paid status), payment method, "Make payment" primary, Payment History link, cancel (if allowed) as ghost-danger at bottom.
- **PaymentWebView:** keeps native header "Payment", loading state = brand spinner + "Connecting to payment…".

### 8.5 Account (Profile)
- Profile header: avatar, name, member code eyebrow, KYC status pill.
- **Savings** — amount card (green) + "Deposit" primary / "Withdraw" secondary; target goal card (progress ring, gold); transaction list.
- **Loans** — "Apply for loan" primary on top (when eligible); loan cards with balance, next due, status; repayment flow.
- **Repayments** — segmented [Upcoming | History]; upcoming rows with amounts + "Pay" per row; overdue highlighted danger.
- **Notifications** — grouped by date, unread = brand_soft left bar + dot; mark-all-read in header.
- **PaymentMethods** — method rows (icon, last4, verified), add-method sheet, primary/default badge on selected.
- **Transactions** — filter chips (All / In / Out), icon-led rows, amount right colored by direction.
- **ActivityLog** — timeline grouped by day, muted captions, device & IP eyebrow rows.
- **SupportTickets** — list + "New ticket"; message thread with bubbles (user right = brand green, reply left = white), composer pinned above safe area.
- **Investments / Portfolio / Distributions / Redemptions** — amount cards with gold "yield" identity; product list rows; confirmed orders get success pills; pending → gold.

### 8.6 KYC
- Stepper (Identity → Documents → Review); upload cards with dashed borders; status page mirrors backend state with calm wording and retry CTAs. Success = brand check tile.

### 8.7 Onboarding (new)
- 3 screens, varied composition (not repeated slides): ① co-op/belonging (brand green, emblem orbit), ② BNPL value (rust, product card motif), ③ savings & merit (gold). Copy ≤ 2 lines each; pagination dots; CTA "Start" on final → straight into Registration.

---

## 9. Motion

| Moment | Behavior | iOS | Android |
|---|---|---|---|
| Sheet open | Rise + slight overshoot | spring (mass 1, stiff 210, damping 20) with grabber reveal | M3 emphasized ease 300ms |
| Card press | 0.98 scale + shadow flatten | 150ms ease-out | 0ms press + ripple on green soft |
| List reveal | Staggered fade-up (≤ 6 rows) | ease-out 240ms, 30ms stagger | fade 200ms |
| Tab switch | Crossfade content, icon spring | 250ms | 250ms |
| Amount change | Short crossfade from old to new digits + tick haptic | 200ms | 200ms |
| Success | Check-in + light haptic pulse | success-style | Android tick vibration |
| Reduce motion | System override → fade only, no spring, no stagger | Respect `AccessibilityInfo.isReduceMotionEnabled` on both | |

---

## 10. Platform-Native Behaviors

- **Biometrics:** `expo-local-authentication` gate on app open (BiometricGate exists — restyle to warm). Offer enable after login; mask amounts until first Face/Finger unlock when enabled.
- **Notifications:** permission prompt contextual (after first balance event), not at launch. Deep-link push → correct tab + screen (e.g., `plans/:id`, `payables/:id`).
- **Payments:** `PaymentWebView` keeps its own secure session; never screenshots the webview (flag `FLAG_SECURE`).
- **Device trust:** keep existing rooted/jailbroken block (`RestrictedScreen`) — restyle to warm surface with rust/ink instead of navy.
- **Offline:** readonly cached balances badge "Last updated 2m ago"; money actions disabled with toast.

---

## 11. Accessibility

- Contrast: body text ≥ 4.5:1 on cream/white; eyebrow gold ≥ 4.5:1; buttons `#FFF9EF` on brand ≥ 4.5:1.
- All interactive elements have `accessibilityRole`/`Label`; tab `tabBarAccessibilityLabel` retained.
- Touch targets ≥ 48pt; text scaled by system (fontScale respected).
- Reduced motion respected (see §9). Color is never the sole status signal — always pair dot + label.
- Form errors announced via `accessibilityLiveRegion`/`accessibilityAnnounce`.

---

## 12. Dark Mode

- Warm-tinted night (§3.2) follows system; no separate toggle. Sheets/headers/tab bars tint dark `surface`, hairlines `#3A3228`, green soft washes use 15% `brand` at night.
- Preserve tabular numerals & mask state in both themes.

---

## 13. Token Migration Map (current → new)

| Current `theme.ts` | New |
|---|---|
| `brand #0B3B60` | `#176B5B` |
| `brandDark #06263F` | `#0F5A4B` |
| `accent #0F766E` | `#B79B6B` (gold) |
| `background #F6F8FB` | `#FFF9EF` |
| `text #122033` | `#23150F` |
| `muted #627084` | `#6B5245` |
| `border #E2E8F0` | `#E7DCCB` |
| `success` | `#176B5B` (unify with brand) |
| `danger` | `#B3261E` |
| add | `rust #9D4824`, `gold_bright #E4A42A`, `surface_warm #FFF3E2`, `ink_soft #2C1B13`, `faint #A98F78`, `chip #EDE2D3` |

---

## 14. Build Checklist (per page)

- [ ] Uses token map above (no legacy blue)
- [ ] One primary action visible without scrolling on key flow
- [ ] Amounts large/tabular/left-aligned, masked toggle respected
- [ ] Status always dot + label
- [ ] Empty state has CTA
- [ ] Safe-area top/bottom respected (notch, home indicator, nav bar)
- [ ] Reduce-motion + fontScale honoured
- [ ] Touch targets ≥ 48pt
- [ ] Dark mode renders in warm night variant
- [ ] Skelletons while loading, not spinners over content