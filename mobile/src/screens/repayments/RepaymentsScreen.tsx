import { useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import client from '../../api/client';
import { ENDPOINTS } from '../../constants';
import { RepaymentData, RepaymentItem } from '../../types';

export default function RepaymentsScreen() {
  const [data, setData] = useState<RepaymentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');

  useFocusEffect(useCallback(() => {
    (async () => {
      try {
        const { data: res } = await client.get(ENDPOINTS.dashboard.repayments);
        setData(res);
      } catch { /* ignore */ } finally { setLoading(false); }
    })();
  }, []));

  const items = tab === 'upcoming' ? data?.upcoming ?? [] : data?.past ?? [];

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={loading} onRefresh={() => {}} />}>
      {data?.summary && (
        <View style={styles.summaryCards}>
          <View style={styles.summaryCard}><Text style={styles.summaryVal}>₦{(data.summary.totalUpcoming ?? 0).toLocaleString()}</Text><Text style={styles.summaryLabel}>Total Upcoming</Text></View>
          <View style={styles.summaryCard}><Text style={[styles.summaryVal, { color: '#ef4444' }]}>{data.summary.overdueCount ?? 0}</Text><Text style={styles.summaryLabel}>Overdue</Text></View>
          <View style={styles.summaryCard}><Text style={styles.summaryVal}>₦{(data.summary.pastPaid ?? 0).toLocaleString()}</Text><Text style={styles.summaryLabel}>Paid</Text></View>
        </View>
      )}

      <View style={styles.tabs}>
        {(['upcoming', 'past'] as const).map((t) => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.activeTab]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.activeTabText]}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {items.map((item: RepaymentItem) => (
        <View key={item.id} style={styles.itemCard}>
          <View style={styles.itemHeader}>
            <Text style={styles.itemName}>{item.itemName}</Text>
            <Text style={[styles.itemType, { color: item.type === 'Loan' ? '#8b5cf6' : '#2563eb' }]}>{item.type}</Text>
          </View>
          <View style={styles.itemRow}><Text style={styles.itemLabel}>Amount</Text><Text style={styles.itemValue}>₦{Number(item.amount).toLocaleString()}</Text></View>
          {item.lateFee > 0 && <View style={styles.itemRow}><Text style={styles.itemLabel}>Late fee</Text><Text style={[styles.itemValue, { color: '#ef4444' }]}>+₦{Number(item.lateFee).toLocaleString()}</Text></View>}
          <View style={styles.itemRow}><Text style={styles.itemLabel}>Due</Text><Text style={styles.itemValue}>{new Date(item.dueDate).toLocaleDateString('en-NG')}</Text></View>
          <Text style={[styles.itemStatus, { color: item.status === 'paid' ? '#22c55e' : item.overdue ? '#ef4444' : '#eab308' }]}>
            {item.status.toUpperCase()}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  summaryCards: { flexDirection: 'row', padding: 16, gap: 8 },
  summaryCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 16, elevation: 1, alignItems: 'center' },
  summaryVal: { fontSize: 20, fontWeight: 'bold', color: '#1a1a2e' },
  summaryLabel: { fontSize: 12, color: '#666', marginTop: 4 },
  tabs: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 8, backgroundColor: '#e5e7eb', borderRadius: 8 },
  tab: { flex: 1, padding: 12, alignItems: 'center', borderRadius: 8 },
  activeTab: { backgroundColor: '#1a1a2e' },
  tabText: { color: '#666', fontWeight: '600' },
  activeTabText: { color: '#fff' },
  itemCard: { backgroundColor: '#fff', margin: 16, marginBottom: 8, padding: 16, borderRadius: 12, elevation: 1 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  itemName: { fontSize: 16, fontWeight: '600', color: '#1a1a2e', flex: 1 },
  itemType: { fontSize: 12, fontWeight: '600' },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  itemLabel: { fontSize: 13, color: '#666' },
  itemValue: { fontSize: 13, color: '#1a1a2e', fontWeight: '500' },
  itemStatus: { fontSize: 12, fontWeight: '700', marginTop: 8, textAlign: 'right' },
});
