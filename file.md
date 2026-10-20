# Super Admin Overview Redesign

## Design brief

**Route:** `/super-admin`  
**Screen:** `web/src/pages/super-admin/Dashboard.tsx`  
**Audience:** FENAC Coop super administrators monitoring platform operations and making high-impact decisions.  
**Design read:** A redesign of a privileged financial operations dashboard, using the existing Coop visual identity with a calm, scannable, high-information layout.

### Intent

Make the most important operational risks and pending decisions easy to find, while keeping the existing system, finance, audit, and tenant information accessible from one overview. The screen should help an administrator answer, in order:

1. Is there an incident or tenant issue that needs attention?
2. Is there an approval waiting on me?
3. What is the platform's current operational and financial position?
4. Where can I inspect the underlying tenant, incident, or audit detail?

The dashboard is an internal tool, not a marketing page. Use hierarchy, readable data, and predictable interactions instead of decorative hero content, glass effects, or motion.

## Goals

- Bring critical incidents, degraded tenants, and pending withdrawals into a clear priority order.
- Make overview metrics and their source or freshness understandable.
- Keep financial balances, audit activity, and tenant health available without overwhelming the first screen.
- Preserve keyboard, screen-reader, mobile, and dark-theme usability.
- Retain existing route access, APIs, and business actions unless implementation later confirms a behavior is broken or unsafe.

## Non-goals

- Redesigning the rest of the super-admin routes or the global sidebar/topbar.
- Changing role access, approval policy, payment behavior, or financial rules.
- Adding a chart, monitoring feed, or KPI that requires a new backend contract.
- Replacing the app's React, Tailwind, icon, or state-management libraries.
- Adding decorative imagery, animation, or a new typeface.

## Current screen and constraints

The route is protected for `super_admin` and rendered inside the existing `AppLayout`. The current page combines:

- Overview values for tenants, users, onboarding, and incidents.
- Queue depth derived from tenant backlog counts.
- Platform and admin fee-pot balances.
- Pending platform withdrawal approvals, with approval and rejection actions.
- Active incident rows and a high-risk audit activity list.
- Tenant health data, including webhook error presence, backlog count, and BNPL status.
- Dialogs for withdrawals and for approvals that require a destination bank account.

Existing calls include `/admin/super/overview`, `/admin/super/incidents`, `/admin/super/audit-log`, `/admin/tenants-health`, and the `/ledger/fee-pots` endpoints. Preserve those calls and the existing route. Avoid making the visual refresh depend on additional endpoints.

The current KPI strip includes hard-coded uptime and webhook-latency values. It also labels a calculation based on active incidents divided by users as an error rate. These are not reliable substitutes for measured availability, latency, or HTTP error telemetry. Do not present them as live operational metrics. Prefer the values already supported by the existing responses; show an unavailable state or omit a metric if its real source is not available.

The overall app has a warm cream and forest-green identity, a system theme toggle, a collapsible grouped sidebar, Avenir Next-style system typography, React 19, React Router, Tailwind CSS 4, and Lucide icons. Reuse these conventions. Do not introduce a competing design system or additional dependency.

## Proposed information hierarchy

```text
Existing app shell
├── Grouped super-admin sidebar (unchanged)
├── Existing topbar (unchanged)
└── Overview content
    ├── Page title, one-line purpose, Refresh action
    ├── Attention region (only when incidents, degraded tenants,
    │   or pending approvals need action)
    ├── Compact operational summary
    ├── Pending withdrawal approvals
    ├── Fee-pot balances
    ├── Active incidents + high-risk actions
    └── Tenant health
```

The first viewport should show the page title, a clear status/attention message, and the beginning of the summary or approval queue at common laptop heights. Do not force a fixed-height hero or make a large decorative chart compete with live work.

### Page header

- Keep the title **System Overview** to preserve recognition and existing terminology.
- Use a brief supporting sentence describing platform health, approvals, and tenant oversight.
- Place **Refresh** at the right on desktop and below the title on narrow screens.
- While refresh is running, keep the layout stable, disable repeat submission, and announce status accessibly. Show the last successful update time only when the implementation can derive it reliably.

### Attention region

- When there are active critical/high incidents, degraded tenants, or pending withdrawal approvals, show a concise, linked summary before lower-priority information.
- Use text, count, and status label together. Color is supplementary, not the only signal.
- When there is nothing requiring attention, use a restrained positive status line rather than an oversized success panel.
- Do not invent acknowledgement or detail actions. Existing incident actions should only appear actionable if they have working handlers and a valid destination.

### Operational summary

Use a responsive metric strip with a small number of concise, directly supported values:

- Tenants
- Active users / total users
- Onboarding this month
- Active incidents
- Combined backlog count, with tenant count for context

Keep labels short and secondary context directly beneath each value. Show loading placeholders that match the final shape. Use a clear unavailable state for a failed or missing source instead of rendering zero as if it were confirmed data.

Only show uptime, webhook latency, and a percentage error rate after their authoritative sources, units, and time windows are known. Never infer an error rate from incident count and user count.

### Pending withdrawal approvals

- Keep the accountant-originated requests prominent because they require a super-admin decision.
- Each item should expose amount, request age, pot type, and available destination information in a readable row.
- Keep the current approve/reject behavior and endpoint contracts. Make the payment consequence explicit in the action label when approval triggers payment.
- Preserve the bank/account form for requests without a destination. Group the account number, bank selector, detected-bank feedback, validation, and submission state together.
- Use a real empty state such as “All caught up” only after the withdrawal request has loaded successfully. A failed request must not look like an empty queue.

### Fee-pot balances

- Present Platform Pot and Admin Pot as one financial section with equal visual footing and a shared heading.
- Display Naira amounts with clear number formatting and avoid implying a live balance if that endpoint failed.
- Keep the existing withdrawal entry point and payout-review jump link. Keep percentage descriptions only if they remain verified business rules.
- Avoid decorative trend indicators unless the API supplies a real comparison period.

### Incidents and audit activity

- Use a wider incident list beside a narrower high-risk activity feed on wide screens; stack them on smaller screens.
- Incident rows should prioritize title, severity, source, tenant/global scope, time detected, status, and supported actions.
- The audit feed should show action, actor, target, and timestamp. Do not use raw serialized change objects as the primary description; if details are exposed, format them safely and make them available on demand.
- Limit initial rows to a useful preview and provide a route to the full incidents or audit log where available.

### Tenant health

- Keep a semantic table on desktop for tenant, health, webhook state, backlog, and BNPL status.
- On narrow screens, allow horizontal table scrolling with a visible cue or use a compact row layout that preserves the same information.
- Provide text labels for healthy/degraded and active/disabled states. Do not use a colored dot alone.
- Keep an empty state distinct from a loading or failed state.

## Visual system

### Direction and dials

- **Pattern:** Focused operations overview with a priority queue, compact metrics, and one detailed health table.
- **Variance:** 4/10. Familiar, orderly grouping with modest layout contrast between priority work and supporting data.
- **Motion:** 2/10. No automatic entrance choreography. Use only short transitions for user feedback and state changes; respect `prefers-reduced-motion`.
- **Density:** 7/10. Dense enough for an admin workflow, with enough spacing and type hierarchy to keep rows scannable.
- **Theme:** Preserve the app's light and dark theme capability. The route should not force one theme or mix themes within the page.

### Color and tokens

Keep the existing Coop palette as the source of truth and map it to semantic tokens rather than adding unrelated hard-coded colors:

| Semantic role | Existing light-theme value | Intended use |
|---|---|---|
| Page background | `#FFF9EF` | Main canvas |
| Primary text | `#2C1B13` | Headings and important values |
| Secondary text | `#6B5245` | Labels and supporting copy |
| Primary action | `#176B5B` | Main navigation/action emphasis |
| Warning | `#E4A42A` | Pending work and caution |
| Destructive/error | `#B3261E` | Critical incidents and rejected/failed states |
| Border/divider | `#E7DCCB` / `#EDE2D3` | Section boundaries and row separators |
| Surface | `#FFFFFF` | Tables, grouped content, and dialogs |

Map these semantic roles to legible dark-theme equivalents using the existing `.dark` strategy. Preserve the brand palette where contrast permits, but test foreground/background pairs in both themes. Keep status colors consistent and always pair them with text or an icon.

Use the existing Avenir Next/system font stack and Lucide icon family. Use one restrained radius scale: roughly 12px for section surfaces, 8-10px for controls, and pill shapes only for compact status badges. Prefer borders and whitespace over shadows on every section.

## Responsive and accessibility behavior

- **Desktop, 1280px and wider:** Use the existing sidebar shell. Let the page use available width, with a restrained max content width if needed. Show paired sections and the full tenant table.
- **Tablet, 768-1279px:** Reduce metric columns and stack complex paired content before text becomes cramped.
- **Mobile, below 768px:** Use the existing mobile sidebar drawer. Stack all content, keep actions reachable, prevent horizontal page overflow, and allow only the table region itself to scroll horizontally if required.
- Preserve the skip-to-main link, semantic heading order, visible focus treatment, and keyboard-operable controls.
- Dialogs must have an accessible name, modal semantics, sensible focus entry/return, keyboard close behavior, and an error message announced to assistive technology.
- Associate every input with a visible label. Place field errors beside the relevant field, connect them with `aria-describedby`, and announce submission errors.
- Use `aria-busy` or equivalent status announcements for loading and refresh. Maintain stable layout while data loads.
- Keep the reduced-motion behavior already present in global styles. Avoid requiring animation to understand any state.
- Validate at 375px, 768px, 1024px, and 1440px, in both themes, with keyboard navigation.

## Data and state contract

Treat each existing endpoint as an independently loaded dashboard section. The UI must distinguish:

1. Initial loading
2. Successful data, including a genuinely empty result
3. Partial failure for one section while others remain available
4. Refresh in progress
5. Stale data, if freshness can be measured

Do not swallow an endpoint failure into a convincing zero or healthy state. Retain previously loaded data during refresh where appropriate, mark it stale if refresh fails, and give the administrator a clear retry action. Do not add polling or real-time claims as part of this redesign.

## Implementation constraints and calls left to the builder

- Keep scope in `SuperAdminDashboard` and narrowly related page-local components/styles. Do not restructure `AppLayout`, sidebar navigation, unrelated admin pages, API contracts, or domain rules as part of the visual pass.
- Reuse the current React/Tailwind/API/store patterns and installed icon package. Add no library.
- Preserve the existing withdrawal dialogs and input data requirements. The visual work must not bypass or weaken backend authorization and payment checks.
- Confirm which API fields are authoritative for status, freshness, balances, and any proposed KPI before displaying them. Do not add new metrics based on assumptions.
- If an existing button is not wired to an action, either connect it to an existing valid route/handler within approved scope or render it as non-interactive text until that behavior is specified.
- Keep current route paths and page labels stable. No information-architecture changes are included.

## Acceptance criteria

- Critical incidents, degraded tenants, and pending approvals are easy to identify before routine supporting detail.
- No hard-coded uptime or latency value is presented as live, and no incident/user ratio is labeled as HTTP error rate.
- A failed endpoint is distinguishable from a true zero/empty result; one failed section does not hide other loaded sections.
- Existing overview, financial, approval, incident, audit, and tenant-health data and actions remain available.
- Payment and rejection actions clearly communicate their consequence and retain their current server-side behavior.
- The page remains usable at 375px without page-level horizontal overflow; the health table has a usable narrow-screen treatment.
- Both light and dark themes remain coherent, with readable contrast, semantic status text, visible focus, and accessible dialog/form errors.
- Loading, empty, error, refresh, and action-pending states are designed, not left to browser defaults.
- No new dependency or unrelated route/layout change is required.

## UI/UX research notes

- The current project stack is React with Tailwind CSS 4; reusing it avoids a needless migration.
- UI Pro Max guidance for admin tables, loading feedback, empty/error states, focus visibility, and inline field errors informed the interaction requirements above.
- The generic generated design-system result suggested a glassy real-time landing pattern. It was rejected because this is a privileged operations console, existing branding is warm and cooperative, and the current API does not establish real-time telemetry.
- The design-system token guidance informed the semantic role table. No token files or application code are changed by this document.
