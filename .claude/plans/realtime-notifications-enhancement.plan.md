# Plan: Real-Time Notifications Enhancement

**Complexity**: Medium
**Estimated Effort**: 16-24 hours

## Summary
Extend the existing SSE-based realtime infrastructure (currently limited to support tickets) to deliver real-time notifications, alerts, dashboard updates, and system events to all user roles across web and mobile clients.

## Patterns to Mirror

| Category | Source | Pattern |
|----------|--------|---------|
| SSE Auth | `backend/src/modules/realtime/sse-auth.guard.ts:13-66` | JWT in Authorization header, query token rejected, user hydration |
| Event Model | `backend/src/modules/realtime/realtime.service.ts:5-15` | `TicketEvent` interface with typed fields, ISO timestamps |
| Stream Methods | `backend/src/modules/realtime/realtime.service.ts:44-75` | `stream()`, `streamAll()`, `streamForUser()` with heartbeat (15s) |
| Controller Routes | `backend/src/modules/realtime/realtime.controller.ts:27-69` | Role-gated `@Sse` endpoints, ticket ownership validation |
| Module Registration | `backend/src/app.module.ts:66,266` | `RealtimeModule` imported, providers registered |
| Notification Entity | `backend/src/modules/notifications/entities/in-app-notification.entity.ts` | Existing notification persistence pattern |

## Files to Change

| File | Action | Why |
|------|--------|-----|
| `backend/src/modules/realtime/realtime.service.ts` | UPDATE | Add notification event types, user-scoped streams, broadcast channels |
| `backend/src/modules/realtime/realtime.controller.ts` | UPDATE | Add notification stream endpoints for all roles |
| `backend/src/modules/realtime/realtime.module.ts` | UPDATE | Export service for cross-module injection |
| `backend/src/modules/notifications/notifications.service.ts` | UPDATE | Emit realtime events on notification creation |
| `backend/src/modules/notifications/notifications.controller.ts` | UPDATE | Add SSE endpoint for notification stream |
| `backend/src/modules/dashboard/dashboard.service.ts` | UPDATE | Emit realtime dashboard metric updates |
| `backend/src/modules/admin/admin.service.ts` | UPDATE | Emit realtime admin alerts (incidents, disputes, risk flags) |
| `backend/src/common/monitoring/alert.service.ts` | UPDATE | Emit realtime system alerts |
| `web/src/stores/realtime.store.ts` | CREATE | Zustand store for SSE connection management, event buffering |
| `web/src/hooks/useRealtime.ts` | CREATE | React hook for subscribing to realtime streams |
| `web/src/components/notifications/NotificationBell.tsx` | CREATE | Real-time notification indicator with dropdown |
| `web/src/components/notifications/NotificationList.tsx` | CREATE | Real-time notification list with mark-read actions |
| `mobile/src/stores/realtime.ts` | CREATE | Mobile SSE connection management (Expo-compatible) |
| `mobile/src/hooks/useRealtime.ts` | CREATE | Mobile realtime hook |
| `mobile/src/components/NotificationBell.tsx` | CREATE | Mobile notification indicator |

## Tasks

### Task 1: Extend Realtime Service Event Model
- **Action**: Add `NotificationEvent`, `DashboardEvent`, `AdminAlertEvent`, `SystemEvent` interfaces; add `publishNotification()`, `publishDashboardUpdate()`, `publishAdminAlert()`, `publishSystemAlert()` methods; add `streamNotifications(userId)`, `streamDashboard(role)`, `streamAdminAlerts()` stream methods
- **Mirror**: Follow `TicketEvent` pattern (typed fields, ISO timestamps, `createdBy`); follow `streamForUser()` pattern with heartbeat
- **Validate**: `npm run build` in backend; unit test new stream methods

### Task 2: Add Realtime Controller Endpoints
- **Action**: Add `@Sse('notifications/stream')` for individual/business-manager/accountant roles; `@Sse('dashboard/stream')` for dashboard roles; `@Sse('admin/alerts/stream')` for super_admin/customer_care; `@Sse('system/alerts/stream')` for super_admin
- **Mirror**: Follow `streamIndividualTickets()` ownership validation pattern; role checks from `streamSupportTickets()`
- **Validate**: `curl -H "Authorization: Bearer <token>" -N http://localhost:3001/api/v1/realtime/notifications/stream`

### Task 3: Integrate Notifications Service with Realtime
- **Action**: Inject `RealtimeService` into `NotificationsService`; call `publishNotification()` in `create()` method; ensure events include notification ID, type, title, message, priority, actionUrl
- **Mirror**: Follow existing `NotificationsService.create()` pattern (audit log, user lookup); use `MonitoringService` pattern for cross-service calls
- **Validate**: Create notification via API, verify SSE event received

### Task 4: Integrate Dashboard Service with Realtime
- **Action**: Inject `RealtimeService` into `DashboardService`; emit updates on key metric changes (loan portfolio, savings totals, BNPL volume, investment NAV); throttle to max 1 event/30s per metric
- **Mirror**: Follow `DashboardService.getStats()` query patterns; use `SchedulerModule` cron jobs for periodic pushes
- **Validate**: Dashboard metrics update in real-time without refresh

### Task 5: Integrate Admin/Monitoring Services with Realtime
- **Action**: Hook `AdminService` incident/dispute creation → `publishAdminAlert()`; hook `AlertService` threshold breaches → `publishSystemAlert()`; include severity, resource, actionRequired
- **Mirror**: Follow `AdminService.createIncident()` audit logging pattern; `AlertService.checkThresholds()` schedule
- **Validate**: Admin dashboard shows live incident alerts; system alerts appear for super_admins

### Task 6: Web Frontend - Realtime Store & Hooks
- **Action**: Create `realtime.store.ts` with Zustand: connection state, event buffer, reconnection logic (exponential backoff), role-based stream subscription; create `useRealtime()` hook with typed event handlers
- **Mirror**: Follow `auth.store.ts` pattern (persist, middleware); follow `web/src/hooks/` conventions
- **Validate**: Web console connects to SSE, survives network interruptions, reconnects

### Task 7: Web Frontend - Notification UI Components
- **Action**: Create `NotificationBell` (unread count badge, dropdown with real-time updates); `NotificationList` (infinite scroll, mark-read, filter by type); integrate into `AppLayout.tsx` header
- **Mirror**: Follow `AppLayout.tsx` component structure; use `lucide-react` icons; follow `tailwind-merge` + `clsx` styling
- **Validate**: Notification bell shows live count; dropdown updates without refresh; mark-read persists

### Task 8: Mobile Frontend - Realtime & Notification UI
- **Action**: Create mobile-compatible SSE client (using `event-source-polyfill` or native `EventSource`); create `useRealtime` hook; create `NotificationBell` component for mobile header; handle background/foreground app state
- **Mirror**: Follow `mobile/src/stores/auth.store.ts` pattern; follow Expo background task patterns
- **Validate**: Mobile app receives real-time notifications in foreground/background

### Task 9: Cross-Cutting - Connection Resilience & Scaling
- **Action**: Add connection limits per user (max 3 concurrent SSE); add Redis-backed horizontal scaling for `RealtimeService` (publish to Redis, all instances fan out); add connection health metrics to `MonitoringService`
- **Mirror**: Follow `DbThrottleStorage` pattern for distributed state; follow `ThrottleSweepModule` for cleanup
- **Validate**: Load test with 1000 concurrent SSE connections; verify horizontal scaling

## Validation

```bash
# Backend
cd backend && npm run build && npm run test

# Web
cd web && npm run build && npm run lint

# Mobile
cd mobile && npm run build  # or expo export

# Integration test
# 1. Start backend, web, mobile
# 2. Login as individual user on web
# 3. Trigger notification via API (POST /api/v1/notifications)
# 4. Verify real-time bell update on web
# 5. Verify real-time notification on mobile
# 6. Test admin alert flow (create incident)
# 7. Test dashboard metric push
```

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| SSE connection exhaustion at scale | Medium | Connection limits, Redis horizontal scaling, heartbeat cleanup |
| Event ordering guarantees | Low | Single-writer per user stream; sequence numbers in events |
| Mobile background SSE reliability | Medium | Fallback to push notifications (Expo push) for background |
| Memory leaks from unbounded event buffers | Low | Bounded buffers (max 100 events), TTL cleanup |
| Cross-tab duplicate connections | Low | `BroadcastChannel` API to share single SSE connection |

## Acceptance
- [ ] All 4 new SSE endpoints operational with role-based access
- [ ] Notifications, dashboard, admin, system events flow in real-time
- [ ] Web notification bell shows live unread count, updates without refresh
- [ ] Mobile receives real-time notifications (foreground)
- [ ] Horizontal scaling works (multiple backend instances)
- [ ] Connection cleanup on disconnect (heartbeat, tab close)
- [ ] All validation commands pass