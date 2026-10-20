# Shared Broadcast Notifications + Real-Time Delivery — Design

**Date:** 2026-10-19
**Status:** Awaiting approval

## Intent

Today, "Broadcast to app users" fans a single message out into one
`in_app_notifications` row per individual member. A send to 5,000 members
writes 5,000 rows. We want a **single shared broadcast record** per send so
the database and server do far less work, and we want deliveries to be
**pushed** to members in real time instead of waiting for their inbox to
poll.

## Goals

- One database row per broadcast send, regardless of audience size.
- Per-member read/dismiss state kept without a per-member row for members
  who never interact with the broadcast.
- Members receive a new broadcast live (inbox list updates, unread badge
  increments) with no page refresh.
- Existing per-user notifications (KYC, deposits, support tickets, etc.)
  keep working unchanged.

## Non-Goals

- Email/SMS delivery of broadcasts. The broadcast button stays in-app only.
- Push notifications to the mobile app via FCM/APNs. (Note: the live channel
  for mobile is out of scope here; see "Open / later".)
- Scheduled, expiring, or targeting/segmented broadcasts (e.g. by
  organization). Audience remains "all individual members".
- Migrating existing fan-out notification history into the new model.

### Audience decision (confirmed)

Broadcasts reach **`individual` members only** — today's behavior and the UI's
promise. Concretely:

- `GET /notifications` broadcast-merge runs **only when the caller is
  `individual`**. Staff roles (`super_admin`, `operational_admin`,
  `business_manager`) keep their existing personal-notification access and see
  **no** broadcasts. The merge is role-gated at the query, not just at the UI.
- `GET /notifications/unread-count` adds the broadcast component **only for
  `individual`**.
- The new SSE stream endpoint is scoped to `individual` (see Live push).
- The super-admin send response is **unchanged**: `POST
  /notifications/broadcast` keeps returning `{ sent }` (the individual
  audience size), so `web/src/pages/super-admin/NotificationTemplates.tsx`
  needs **no change**. The send still counts the audience but does not write
  per-member rows.

## Anti-Goals (what would make this a failure)

- A member seeing a broadcast they already dismissed reappear after a
  refresh, reconnect, or new broadcast send.
- A non-individual role receiving a broadcast.
- The live channel weakening SSE auth (e.g. accepting JWTs in query
  strings) to make it work.
- Broadcast sends that still scale write-amplification with audience size.

## Constraints

- **TypeORM schema is driven by `synchronize`** (`DB_SYNCHRONIZE === 'true'`)
  and the explicit `entities` array in `backend/src/app.module.ts`. There are
  no automated TypeORM migrations; `backend/scripts/migrations/*.sql` are
  applied by hand. New tables must be added to the `entities` array and, for
  non-synchronized environments, a hand-written SQL file in
  `backend/scripts/migrations/`.
- **Reuse the existing SSE stack** (`RealtimeModule`, `SseAuthGuard`,
  `RealtimeService`) rather than introduce a websocket library.
- **`SseAuthGuard` requires `Authorization: Bearer`** and rejects query-string
  tokens by design.
- Web uses axios with `baseURL: '/api/v1'`; mobile is React Native (no browser
  `EventSource`).

## Current State (what exists)

- `NotificationsService.broadcast()` (`notifications.service.ts:64`) loads all
  `Role.INDIVIDUAL` users and maps them to rows. (Line 72 has a no-op ternary
  `In(Role.INDIVIDUAL ? [Role.INDIVIDUAL] : [])` — to be simplified in
  passing.)
- `NotificationsService.create()` writes a single per-user row. Callers:
  savings, auth, kyc, support, first-virtual.
- `GET /api/v1/notifications` returns `{ data, total, unread }` for the
  current user — the individual inbox reads this.
- `RealtimeService` is a single-process RxJS pub/sub (support tickets only),
  with `streamAll()` and `streamForUser(userId)`.
- `SseAuthGuard` rejects query tokens; the **web SSE client
  (`useTicketStream.ts`) sends the JWT as `?token=`** and therefore currently
  receives 401. This is a pre-existing bug that blocks any push feature and is
  fixed as part of this work.

## Decided

These are the calls already made with the product owner. Builder should treat
them as fixed.

### Data model — one shared row + sparse per-member receipts

**New entity `Broadcast`** (`in_app_broadcasts`):

| column | type | notes |
|--------|------|-------|
| `id` | uuid PK | |
| `title` | varchar(255) | |
| `message` | text, nullable | |
| `type` | enum(`NotificationType`) | reuse existing enum |
| `link` | varchar, nullable | deep link |
| `created_by` | uuid, nullable | admin user id |
| `created_at` | timestamptz | `@CreateDateColumn` |

Index: `(created_at DESC)` for the inbox query.

**New entity `BroadcastReceipt`** (`in_app_broadcast_receipts`):

| column | type | notes |
|--------|------|-------|
| `id` | uuid PK | |
| `broadcast_id` | uuid FK → `in_app_broadcasts.id` | ON DELETE CASCADE |
| `user_id` | uuid | |
| `is_read` | boolean default false | set by "mark read" |
| `read_at` | timestamptz, nullable | |
| `dismissed_at` | timestamptz, nullable | set by "dismiss" |

**Unique index `(broadcast_id, user_id)`.** Receipts are **sparse**: a row is
created only when a member reads or dismisses. A broadcast with no interaction
has zero receipt rows. This is a deliberate reversal of "override defaults on
read" — we do not materialize a row per member per broadcast, because that
reintroduces the fan-out we are removing.

**Read semantics:**

- **Unread** = `dismissed_at IS NULL` AND `is_read = false`.
- **"Mark all as read"** must materialize receipts for **every non-dismissed
  broadcast the member has no receipt for** — implement as
  `INSERT ... SELECT` (or an "all read up to timestamp" watermark) over
  `in_app_broadcasts` LEFT-joined to the member's receipts where
  `dismissed_at IS NULL`. A plain `UPDATE` would touch nothing for a member
  with no receipts. This is a deliberate, bounded exception to "sparse": a
  member clicking "mark all" once writes one receipt per outstanding broadcast.
  That is fine (it is user-initiated, not per-send), but should be noted.
- **Per-broadcast read** upserts a single receipt with `is_read = true`.
- **Dismiss** upserts `dismissed_at = now()`; the broadcast is then excluded
  from that member's inbox list, unread count, and live prepends.

Personal notifications (`in_app_notifications`) keep their existing
`isRead`/`markAsRead`/`markAllAsRead` behavior untouched.

### Inbox merge (per-member, on read)

`GET /api/v1/notifications` continues to return `{ data, total, unread }`, where
`data` is the merge of:

- the user's personal `in_app_notifications` (unchanged), and
- **only for `individual` callers**: broadcasts where the user has **no
  dismissed receipt**, LEFT JOINed to the user's receipt for the `isRead`
  flag, sorted by `createdAt` together.

The merged item carries a discriminator (`kind: 'notification' | 'broadcast'`)
and the fields the current UI already renders (`id`, `title`, `message`,
`type`, `isRead`, `link`, `createdAt`).

**Pagination correction.** The individual inbox renders the full merged list
today (it calls `GET /notifications` once with no paging; the route's
`limit`/`offset` exist but the page doesn't offset-page). So the simple "fetch
N of each, merge in memory" approach is acceptable **only** if the client does
not offset-page a merged list — in-memory merge cannot honor `offset`
correctly. Decision: `total` = personal count + non-dismissed broadcast count;
the page keeps loading the merged list in one shot (raise the effective cap as
needed); if offset paging of the merged list is ever needed, implement it as a
single `UNION ALL` query ordered by `created_at`. The builder may start with
in-memory merge; it is not a correctness bug at today's list sizes.

`GET /api/v1/notifications/unread-count` returns personal unread + broadcast
unread (broadcasts not dismissed and not read).

### API surface

| method | path | notes |
|--------|------|-------|
| POST | `/notifications/broadcast` | 1 insert; publishes one live event; returns `{ sent }` (unchanged) |
| GET | `/notifications` | merged inbox (individual only gets broadcasts) |
| GET | `/notifications/unread-count` | personal + broadcast (broadcast only for individual) |
| PATCH | `/notifications/read-all` | personal (unchanged) **and** broadcast receipts materialized `is_read` |
| PATCH | `/notifications/broadcasts/:id/read` | upsert read receipt for current user |
| DELETE | `/notifications/broadcasts/:id` | upsert `dismissed_at` for current user |
| GET | `/realtime/notifications/stream` | SSE, **individual only**, user-scoped (see below) |

`DELETE /notifications/:id` remains for personal notifications only. Broadcast
dismissal is a distinct route because it upserts a receipt rather than deleting
a row.

**`Broadcast` audience** stays implicit: all `Role.INDIVIDUAL` members. The
send endpoint no longer queries the user table at all — dropping the O(N) read
and the O(N) write.

### Live push

- `RealtimeService` gains a `NotificationEvent` interface (pinned alongside
  `TicketEvent`) and `publishNotification(audience, event)`. Because a
  broadcast targets all individuals, publish a single event addressed to the
  audience `'individuals'`; per-user personal notifications publish addressed
  to their `userId`.

  Pinned event shape (server and client must agree on these exact names):

  ```ts
  interface NotificationEvent {
    kind: 'broadcast' | 'notification';
    id: string;
    title: string;
    message?: string | null;
    type: 'info' | 'success' | 'warning' | 'error';
    link?: string | null;
    createdAt: string; // ISO
    audience?: 'individuals' | string; // 'individuals' for broadcasts, userId otherwise
  }
  ```

- Add `streamNotifications(userId)` returning an observable whose filter passes
  events addressed to that user **or** to `'individuals'`.
- New SSE endpoint `GET /api/v1/realtime/notifications/stream`
  (`SseAuthGuard`), **allowed for `individual` only** — a non-individual caller
  gets `ForbiddenException`, so no staff role can receive a broadcast. It
  streams `streamNotifications(req.user.sub)`.
- `NotificationsService.create()` publishes a `NotificationEvent` after save.
  `NotificationsService.broadcast()` publishes exactly one `'individuals'`
  event carrying the broadcast id and content.

### Web client push (and the auth fix)

- **Fix the SSE auth bug:** replace `EventSource` in `useTicketStream.ts`
  (and the new notifications hook) with a **fetch-based SSE reader** that sends
  the `Authorization: Bearer` header and reads the streamed body incrementally
  (`ReadableStream` + `TextDecoder`, splitting on `\n\n`). This keeps the guard's
  "header only" rule intact. Reconnect with a refreshed token on drop, as the
  existing hook already intends. `getAccessToken()` (`client.ts:12`) and
  `refreshAccessToken()` (`client.ts:144`) exist and work as assumed. Fix the
  stale comment in `useTicketStream.ts` that claims the guard "accepts either";
  it does not. Send `credentials: 'include'` and refresh before the first open
  when `getAccessToken()` is null (post-reload).
- New hook `useNotificationStream(onEvent)` opens
  `/api/v1/realtime/notifications/stream`. On a broadcast event the
  `Notifications` page prepends the item and bumps the unread count.
- **Shared state.** The bell (`Topbar.tsx:14-20`) and the page
  (`Notifications.tsx:50-51`) each hold **local** unread state fetched once and
  never re-fetched on an event, so neither increments live today. Introduce a
  small shared notifications store (context or a tiny Zustand store) that the
  SSE hook writes to and both `Topbar` and the page read from. This is the
  mechanism that makes "unread ticks up without refresh" real.
- Reconnect does **not** replay missed events (`Subject` has no `Last-Event-ID`);
  a broadcast sent while disconnected is recovered on the next inbox GET. That
  satisfies "a dismissed broadcast never reappears"; live is best-effort.
- Mobile: out of scope for the live channel in this change (RN has no
  `EventSource`); the inbox merge and receipt model still apply, so mobile gets
  correct data on load. See "Open / later".

### Session skip (not correctness)

Dismissal is a **server-side receipt**, so a reloaded client already gets
correct data. The SSE hook additionally ignores an incoming broadcast event
whose id the user dismissed **in this session** — that only guards the race
where an event lands just after a dismiss. Do not rely on the session set for
correctness; the receipt is the source of truth.

## Left to the builder

- Exact RxJS wiring for the audience-addressed event and the filter.
- Whether the merged inbox uses in-memory merge or a `UNION ALL` query.
- Fetch-based SSE reader details (chunk buffering, `AbortController`, backoff).
- The shared-store mechanism for the bell/page unread count (context vs Zustand).
- Test strategy: unit tests for `broadcast()` (asserts **one** insert, one
  publish, and a `sent` count), receipt upsert idempotency, inbox merge
  excluding dismissed, unread math (including mark-all materialization), and
  the SSE auth-path (header accepted, no query token, non-individual forbidden).

### Reviewer-resolved details (build these as decided)

- **`created_by`:** populate the send endpoint's `created_by` from
  `@CurrentUser('sub')` (the controller handler currently takes only the body —
  add the param). Do not leave it unwritten.
- **`type` enum:** TypeORM will create a **second** Postgres enum type for
  `in_app_broadcasts`; the hand-written SQL in `backend/scripts/migrations/`
  must match TypeORM's generated type, or intentionally reuse a shared enum.
- **Retention:** `common/retention.service.ts:36` purges `in_app_notifications`
  after 30 days but nothing covers the broadcast tables, so they grow
  unbounded. Out of scope now (expiry is "Open / later"); noted so a stray
  broadcast is not expected to auto-expire.
- **UI `kind` branching:** `Notification` (`Notifications.tsx:8-16`) has no
  `kind`; the list uses `key={n.id}` and dismiss calls
  `api.delete('/notifications/${id}')`. Add `kind`, use a `kind`-prefixed React
  key, and branch dismiss to `DELETE /notifications/broadcasts/:id` when
  `kind === 'broadcast'`. Route ordering is safe (`broadcasts/:id` vs `:id`,
  `read-all` vs `:id/read` do not collide).
- **Migration path:** the SQL file goes in `backend/scripts/migrations/`
  (sibling to `20261019_shared_bnpl_plans.sql`); there is no runner, so it is
  hand-applied in non-synchronized environments.

## Files expected to change

**Backend**
- `src/modules/notifications/entities/broadcast.entity.ts` (new)
- `src/modules/notifications/entities/broadcast-receipt.entity.ts` (new)
- `src/modules/notifications/notifications.service.ts` (broadcast, merge, receipts, publish)
- `src/modules/notifications/notifications.controller.ts` (routes above; `created_by` from current user)
- `src/modules/notifications/notifications.module.ts` (register entities, import RealtimeModule)
- `src/modules/realtime/realtime.service.ts` (NotificationEvent, publishNotification, streamNotifications)
- `src/modules/realtime/realtime.controller.ts` (notifications stream endpoint, individual-only)
- `src/app.module.ts` (add both entities to the `entities` array)
- `backend/scripts/migrations/20261019_shared_broadcasts.sql` (new, hand-applied)

**Web**
- `src/hooks/useTicketStream.ts` (fetch-based SSE; fixes the existing 401)
- `src/hooks/useNotificationStream.ts` (new)
- `src/stores/notifications.store.ts` or a context (new — shared unread state)
- `src/pages/individual/Notifications.tsx` (merge, `kind` branch, dismiss broadcast, live prepend)
- `src/components/layout/Topbar.tsx` (read unread from the shared store, subscribe live)

**No change:** `web/src/pages/super-admin/NotificationTemplates.tsx` — the send
response stays `{ sent }`.

## Open / later

- **Mobile live push.** React Native can't use the fetch-stream reader the
  same way; options are `react-native-sse` (sends headers) or a real push
  channel (FCM). Either way it is a follow-up.
- **Redis fan-out for multi-instance.** `RealtimeService` is in-process; with
  more than one backend instance, a broadcast published on instance A won't
  reach members connected to instance B. Today the platform is single-instance;
  when that changes, publish through Redis pub/sub. Tracked, not built now.
- **Segmented/targeted broadcasts** and **expiry** for time-boxed messages.
