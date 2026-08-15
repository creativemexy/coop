import { useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import client from '../../api/client';
import { ENDPOINTS } from '../../constants';
import { ActivityEntry } from '../../types';

export default function ActivityLogScreen() {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'login' | 'actions'>('all');

  useFocusEffect(useCallback(() => {
    (async () => {
      try {
        const { data } = await client.get(ENDPOINTS.users.activity);
        const payload = Array.isArray(data) ? data : (data as { data?: unknown }).data;
        setEntries(Array.isArray(payload) ? payload : []);
      } catch { /* ignore */ } finally { setLoading(false); }
    })();
  }, []));

  const filtered = entries.filter((e) => {
    if (filter === 'all') return true;
    if (filter === 'login') return e.action?.toLowerCase().includes('login') || e.action?.toLowerCase().includes('logout');
    return !e.action?.toLowerCase().includes('login') && !e.action?.toLowerCase().includes('logout');
  });

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={loading} onRefresh={() => {}} />}>
      <View style={styles.tabs}>
        {(['all', 'login', 'actions'] as const).map((t) => (
          <TouchableOpacity key={t} style={[styles.tab, filter === t && styles.activeTab]} onPress={() => setFilter(t)}>
            <Text style={[styles.tabText, filter === t && styles.activeTabText]}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {filtered.map((e) => (
        <View key={e.id} style={styles.entry}>
          <View style={styles.entryRow}>
            <Text style={styles.action}>{e.action}</Text>
            {e.success !== undefined && (
              <Text style={[styles.success, { color: e.success ? '#22c55e' : '#ef4444' }]}>{e.success ? 'Success' : 'Failed'}</Text>
            )}
          </View>
          {e.details && <Text style={styles.details}>{typeof e.details === 'string' ? e.details : JSON.stringify(e.details)}</Text>}
          <Text style={styles.date}>{new Date(e.createdAt).toLocaleString('en-NG')}</Text>
          {e.ipAddress && <Text style={styles.ip}>IP: {e.ipAddress}</Text>}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  tabs: { flexDirection: 'row', margin: 16, marginBottom: 8, backgroundColor: '#e5e7eb', borderRadius: 8 },
  tab: { flex: 1, padding: 12, alignItems: 'center', borderRadius: 8 },
  activeTab: { backgroundColor: '#1a1a2e' },
  tabText: { color: '#666', fontWeight: '600' },
  activeTabText: { color: '#fff' },
  entry: { backgroundColor: '#fff', margin: 16, marginBottom: 4, padding: 16, borderRadius: 8 },
  entryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  action: { fontSize: 14, fontWeight: '600', color: '#1a1a2e', textTransform: 'capitalize' },
  success: { fontSize: 12, fontWeight: '600' },
  details: { fontSize: 13, color: '#666', marginTop: 4 },
  date: { fontSize: 12, color: '#999', marginTop: 4 },
  ip: { fontSize: 11, color: '#999', marginTop: 2 },
});
