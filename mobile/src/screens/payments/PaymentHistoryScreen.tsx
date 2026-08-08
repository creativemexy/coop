import { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import client from '../../api/client';
import { ENDPOINTS } from '../../constants';

interface Payment {
  id: string;
  amount: number;
  fee: number;
  provider: string;
  providerReference: string;
  status: string;
  payoutStatus: string;
  createdAt: string;
}

export default function PaymentHistoryScreen() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPayments = async () => {
    try {
      const { data } = await client.get(ENDPOINTS.payments);
      setPayments(Array.isArray(data) ? data : []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchPayments(); }, []);

  const formatPrice = (price: number) => `₦${price.toLocaleString()}`;
  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return '#5cb85c';
      case 'failed': return '#d9534f';
      default: return '#f0ad4e';
    }
  };

  const renderPayment = ({ item }: { item: Payment }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.reference}>Ref: {item.providerReference.slice(0, 12)}...</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status.toUpperCase()}</Text>
        </View>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Amount</Text>
        <Text style={styles.detailValue}>{formatPrice(item.amount)}</Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Fee</Text>
        <Text style={styles.detailValue}>{formatPrice(item.fee)}</Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Provider</Text>
        <Text style={styles.detailValue}>{item.provider}</Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Date</Text>
        <Text style={styles.detailValue}>{formatDate(item.createdAt)}</Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Payout</Text>
        <Text style={[styles.detailValue, { color: item.payoutStatus === 'completed' ? '#5cb85c' : '#f0ad4e' }]}>{item.payoutStatus}</Text>
      </View>
    </View>
  );

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#1a1a2e" /></View>;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={payments}
        renderItem={renderPayment}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchPayments(); }} />}
        ListEmptyComponent={<View style={styles.centered}><Text style={styles.emptyText}>No payments yet</Text></View>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  list: { padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  reference: { fontSize: 13, color: '#666' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: '700' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  detailLabel: { fontSize: 13, color: '#666' },
  detailValue: { fontSize: 13, fontWeight: '600', color: '#333' },
  emptyText: { fontSize: 16, color: '#999' },
});