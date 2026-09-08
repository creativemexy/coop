import { useState, useCallback } from 'react';
import { View, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import client from '../../api/client';
import { ENDPOINTS } from '../../constants';
import { NotificationItem } from '../../types';
import { useAccessibility } from '../../ui/a11y';
import { AppPressable, AppText } from '../../ui/primitives';
import { LoadingView } from '../../ui/Loading';
import { spacing, type } from '../../ui/theme';

export default function NotificationsScreen() {
  const [notifs, setNotifs] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { palette, scale } = useAccessibility();

  useFocusEffect(useCallback(() => {
    (async () => {
      try {
        const { data } = await client.get(ENDPOINTS.notifications);
        const payload = Array.isArray(data) ? data : (data as { data?: unknown }).data;
        if (Array.isArray(payload)) {
          setNotifs(
            (payload as NotificationItem[]).map((n) => ({
              ...n,
              read: Boolean((n as any).isRead ?? n.read),
            }))
          );
        }
      } catch { /* ignore */ } finally { setLoading(false); }
    })();
  }, []));

  const markRead = useCallback(async (id: string) => {
    try {
      await client.patch(`${ENDPOINTS.notifications}/${id}/read`);
      setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    } catch { /* ignore */ }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await client.patch(`${ENDPOINTS.notifications}/read-all`);
      setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch { /* ignore */ }
  }, []);

  const typeColors: Record<string, string> = {
    success: palette.success,
    warning: palette.warning,
    error: palette.danger,
    info: '#2563eb',
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: palette.background }]}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={() => {}} tintColor={palette.brand} />}
    >
      <View style={styles.headerRow}>
        <AppText accessibilityRole="header" style={[styles.heading, { color: palette.text, fontSize: scale(type.heading) }]}>
          Notifications
        </AppText>
        <AppPressable
          accessibilityRole="button"
          accessibilityLabel="Mark all notifications as read"
          style={styles.markAllBtn}
          onPress={markAllRead}
        >
          <AppText style={[styles.markAllText, { color: palette.brand, fontSize: scale(type.small) }]}>Mark All Read</AppText>
        </AppPressable>
      </View>

      {loading ? (
        <LoadingView label="Loading notifications…" />
      ) : notifs.length === 0 ? (
        <View style={[styles.empty, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <AppText style={[styles.emptyText, { color: palette.muted, fontSize: scale(type.body) }]}>No notifications yet.</AppText>
        </View>
      ) : (
        notifs.map((n) => {
          const sc = typeColors[n.type] || palette.muted;
          return (
            <AppPressable
              key={n.id}
              accessibilityRole="button"
              accessibilityLabel={n.title}
              accessibilityValue={{ text: n.read ? 'read' : 'unread' }}
              accessibilityHint={n.message}
              onPress={() => !n.read && markRead(n.id)}
              style={[
                styles.card,
                { backgroundColor: palette.surface, borderColor: palette.border },
                !n.read && { backgroundColor: palette.background, borderColor: palette.brand },
              ]}
            >
              <View style={[styles.typeDot, { backgroundColor: sc }]} />
              <View style={styles.cardContent}>
                <AppText style={[styles.title, { color: palette.text, fontSize: scale(type.body) }]} numberOfLines={1}>{n.title}</AppText>
                <AppText style={[styles.message, { color: palette.muted, fontSize: scale(type.small) }]} numberOfLines={2}>{n.message}</AppText>
                <AppText style={[styles.date, { color: palette.muted, fontSize: scale(type.caption) }]}>
                  {new Date(n.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                </AppText>
              </View>
              {!n.read && <View style={[styles.unreadDot, { backgroundColor: palette.brand }]} />}
            </AppPressable>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xs },
  heading: { fontWeight: '800', letterSpacing: -0.5 },
  markAllBtn: { minHeight: 48, justifyContent: 'center' },
  markAllText: { fontWeight: '700' },
  empty: { margin: spacing.lg, padding: spacing.xl, borderRadius: 16, borderWidth: 1, alignItems: 'center' },
  emptyText: { fontWeight: '600' },
  card: { flexDirection: 'row', margin: spacing.lg, marginBottom: spacing.sm, padding: spacing.lg, borderRadius: 16, alignItems: 'center', borderWidth: 1, minHeight: 72 },
  typeDot: { width: 10, height: 10, borderRadius: 5, marginRight: spacing.md },
  cardContent: { flex: 1 },
  title: { fontWeight: '700' },
  message: { marginTop: 2, lineHeight: 18 },
  date: { marginTop: 4, fontWeight: '600' },
  unreadDot: { width: 10, height: 10, borderRadius: 5, marginLeft: spacing.sm },
});
