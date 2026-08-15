import { useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import client from '../../api/client';
import { ENDPOINTS } from '../../constants';
import { UnifiedTransaction } from '../../types';

export default function TransactionsScreen() {
  const [txns, setTxns] = useState<UnifiedTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<UnifiedTransaction | null>(null);

  useFocusEffect(useCallback(() => {
    (async () => {
      try {
        const { data } = await client.get(ENDPOINTS.dashboard.transactions);
        const payload = Array.isArray(data) ? data : (data as { data?: unknown }).data;
        setTxns(Array.isArray(payload) ? payload as UnifiedTransaction[] : []);
      } catch { /* ignore */ } finally { setLoading(false); }
    })();
  }, []));

  const typeColors: Record<string, string> = {
    savings_deposit: '#22c55e', savings_withdrawal: '#ef4444', savings_interest: '#22c55e',
    payment: '#2563eb', installment: '#8b5cf6', loan_due: '#eab308', loan_repayment: '#22c55e',
  };

  const isCredit = (t: UnifiedTransaction) =>
    t.type?.includes('deposit') || t.type?.includes('repayment') || t.type?.includes('interest');

  const ngn = (n: number) => `₦${Number(n || 0).toLocaleString()}`;

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={loading} onRefresh={() => {}} />}>
      <Text style={styles.count}>{txns.length} transactions</Text>
      {txns.length === 0 && <Text style={styles.empty}>No transactions yet</Text>}
      {txns.map((t, i) => (
        <TouchableOpacity key={i} style={styles.txnRow} onPress={() => setSelected(t)}>
          <View style={styles.left}>
            <View style={[styles.dot, { backgroundColor: typeColors[t.type] || '#666' }]} />
            <View>
              <Text style={styles.txnType}>{t.type.replace(/_/g, ' ')}</Text>
              <Text style={styles.txnDesc}>{t.description || t.reference}</Text>
              <Text style={styles.txnDate}>{new Date(t.date).toLocaleDateString('en-NG')}</Text>
            </View>
          </View>
          <View style={styles.right}>
            <Text style={[styles.amount, { color: isCredit(t) ? '#22c55e' : '#ef4444' }]}>
              {isCredit(t) ? '+' : '-'}{ngn(Math.abs(t.amount))}
            </Text>
            <Text style={[styles.status, { color: t.status === 'success' || t.status === 'paid' ? '#22c55e' : t.status === 'pending' ? '#eab308' : '#ef4444' }]}>{t.status}</Text>
          </View>
        </TouchableOpacity>
      ))}

      <Modal visible={!!selected} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{selected?.type.replace(/_/g, ' ').toUpperCase()}</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Amount</Text>
              <Text style={[styles.detailValue, { color: selected && isCredit(selected) ? '#22c55e' : '#ef4444' }]}>
                {selected && isCredit(selected) ? '+' : '-'}{selected ? ngn(Math.abs(selected.amount)) : ''}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Status</Text>
              <Text style={styles.detailValue}>{selected?.status}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date & Time</Text>
              <Text style={styles.detailValue}>{selected ? new Date(selected.date).toLocaleString('en-NG') : ''}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Description</Text>
              <Text style={[styles.detailValue, styles.detailDesc]}>{selected?.description || '—'}</Text>
            </View>
            {selected?.reference ? (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Reference</Text>
                <Text style={[styles.detailValue, styles.detailDesc]}>{selected.reference}</Text>
              </View>
            ) : null}
            <TouchableOpacity style={styles.closeBtn} onPress={() => setSelected(null)}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  count: { fontSize: 13, color: '#666', padding: 16, paddingBottom: 8 },
  empty: { fontSize: 14, color: '#9ca3af', textAlign: 'center', padding: 32 },
  txnRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#fff', padding: 16, marginHorizontal: 16, marginBottom: 1, alignItems: 'center' },
  left: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
  txnType: { fontSize: 14, fontWeight: '600', color: '#1a1a2e', textTransform: 'capitalize' },
  txnDesc: { fontSize: 12, color: '#666', marginTop: 1 },
  txnDate: { fontSize: 11, color: '#999', marginTop: 1 },
  right: { alignItems: 'flex-end' },
  amount: { fontSize: 15, fontWeight: '600' },
  status: { fontSize: 11, marginTop: 2, fontWeight: '500' },
  modalOverlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 24 },
  modal: { backgroundColor: '#fff', borderRadius: 16, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 16 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  detailLabel: { fontSize: 13, color: '#9ca3af', marginRight: 16 },
  detailValue: { fontSize: 14, fontWeight: '600', color: '#1a1a2e', flexShrink: 1, textAlign: 'right' },
  detailDesc: { fontWeight: '400' },
  closeBtn: { backgroundColor: '#1a1a2e', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 20 },
  closeText: { color: '#fff', fontWeight: '600' },
});