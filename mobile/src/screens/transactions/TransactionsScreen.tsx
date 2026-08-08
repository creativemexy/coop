import { useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import client from '../../api/client';
import { ENDPOINTS } from '../../constants';
import { UnifiedTransaction } from '../../types';

export default function TransactionsScreen() {
  const [txns, setTxns] = useState<UnifiedTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    (async () => {
      try {
        const { data } = await client.get(ENDPOINTS.dashboard.transactions);
        setTxns(Array.isArray(data) ? data : []);
      } catch { /* ignore */ } finally { setLoading(false); }
    })();
  }, []));

  const typeColors: Record<string, string> = {
    savings_deposit: '#22c55e', savings_withdrawal: '#ef4444', savings_interest: '#22c55e',
    payment: '#2563eb', installment: '#8b5cf6', loan_due: '#eab308', loan_repayment: '#22c55e',
  };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={loading} onRefresh={() => {}} />}>
      <Text style={styles.count}>{txns.length} transactions</Text>
      {txns.map((t, i) => (
        <View key={i} style={styles.txnRow}>
          <View style={styles.left}>
            <View style={[styles.dot, { backgroundColor: typeColors[t.type] || '#666' }]} />
            <View>
              <Text style={styles.txnType}>{t.type.replace(/_/g, ' ')}</Text>
              <Text style={styles.txnDesc}>{t.description || t.reference}</Text>
              <Text style={styles.txnDate}>{new Date(t.date).toLocaleDateString('en-NG')}</Text>
            </View>
          </View>
          <View style={styles.right}>
            <Text style={[styles.amount, { color: t.type?.includes('deposit') || t.type?.includes('repayment') || t.type?.includes('interest') ? '#22c55e' : '#ef4444' }]}>
              {t.type?.includes('deposit') || t.type?.includes('repayment') || t.type?.includes('interest') ? '+' : '-'}₦{Number(t.amount).toLocaleString()}
            </Text>
            <Text style={[styles.status, { color: t.status === 'success' || t.status === 'paid' ? '#22c55e' : t.status === 'pending' ? '#eab308' : '#ef4444' }]}>{t.status}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  count: { fontSize: 13, color: '#666', padding: 16, paddingBottom: 8 },
  txnRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#fff', padding: 16, marginHorizontal: 16, marginBottom: 1, alignItems: 'center' },
  left: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
  txnType: { fontSize: 14, fontWeight: '600', color: '#1a1a2e', textTransform: 'capitalize' },
  txnDesc: { fontSize: 12, color: '#666', marginTop: 1 },
  txnDate: { fontSize: 11, color: '#999', marginTop: 1 },
  right: { alignItems: 'flex-end' },
  amount: { fontSize: 15, fontWeight: '600' },
  status: { fontSize: 11, marginTop: 2, fontWeight: '500' },
});
