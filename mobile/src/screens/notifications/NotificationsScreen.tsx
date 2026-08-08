import { useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import client from '../../api/client';
import { ENDPOINTS } from '../../constants';
import { NotificationItem } from '../../types';

export default function NotificationsScreen() {
  const [notifs, setNotifs] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    (async () => {
      try {
        const { data } = await client.get(ENDPOINTS.notifications);
        setNotifs(Array.isArray(data) ? data : []);
      } catch { /* ignore */ } finally { setLoading(false); }
    })();
  }, []));

  const markRead = async (id: string) => {
    try {
      await client.patch(`${ENDPOINTS.notifications}/${id}/read`);
      setNotifs(notifs.map((n) => n.id === id ? { ...n, read: true } : n));
    } catch { /* ignore */ }
  };

  const markAllRead = async () => {
    try {
      await client.patch(`${ENDPOINTS.notifications}/read-all`);
      setNotifs(notifs.map((n) => ({ ...n, read: true })));
    } catch { /* ignore */ }
  };

  const typeColors: Record<string, string> = { success: '#22c55e', warning: '#eab308', error: '#ef4444', info: '#2563eb' };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={loading} onRefresh={() => {}} />}>
      <TouchableOpacity style={styles.markAllBtn} onPress={markAllRead}>
        <Text style={styles.markAllText}>Mark All as Read</Text>
      </TouchableOpacity>

      {notifs.map((n) => (
        <TouchableOpacity key={n.id} style={[styles.card, !n.read && styles.unread]} onPress={() => !n.read && markRead(n.id)}>
          <View style={[styles.typeDot, { backgroundColor: typeColors[n.type] || '#666' }]} />
          <View style={styles.cardContent}>
            <Text style={styles.title}>{n.title}</Text>
            <Text style={styles.message} numberOfLines={2}>{n.message}</Text>
            <Text style={styles.date}>{new Date(n.createdAt).toLocaleDateString('en-NG')}</Text>
          </View>
          {!n.read && <View style={styles.unreadDot} />}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  markAllBtn: { alignSelf: 'flex-end', margin: 16, marginBottom: 0 },
  markAllText: { color: '#2563eb', fontSize: 14, fontWeight: '500' },
  card: { flexDirection: 'row', backgroundColor: '#fff', margin: 16, marginBottom: 4, padding: 16, borderRadius: 12, alignItems: 'center' },
  unread: { backgroundColor: '#eff6ff' },
  typeDot: { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
  cardContent: { flex: 1 },
  title: { fontSize: 14, fontWeight: '600', color: '#1a1a2e' },
  message: { fontSize: 13, color: '#666', marginTop: 2 },
  date: { fontSize: 11, color: '#999', marginTop: 4 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2563eb', marginLeft: 8 },
});
