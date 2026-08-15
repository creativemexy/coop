import { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import client from '../../api/client';
import { ENDPOINTS } from '../../constants';
import { BnplSubscription, BnplInstallment } from '../../types';

export default function SubscriptionsScreen({ navigation }: { navigation: any }) {
  const [subscriptions, setSubscriptions] = useState<BnplSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSubscriptions = async () => {
    try {
      const { data } = await client.get(ENDPOINTS.subscriptions);
      setSubscriptions(Array.isArray(data) ? data : []);
    } catch {
      // handle error
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSubscriptions();
  };

  const formatPrice = (price: number | string) => `₦${Number(price || 0).toLocaleString()}`;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#5cb85c';
      case 'completed': return '#4a90d9';
      case 'defaulted': return '#d9534f';
      default: return '#f0ad4e';
    }
  };

  const getNextInstallment = (installments?: BnplInstallment[]) => {
    if (!installments) return null;
    return installments.find((i) => i.status === 'pending');
  };

  const handlePayInstallment = (subscription: BnplSubscription, installment: BnplInstallment) => {
    navigation.navigate('PaymentWebView', {
      subscriptionId: subscription.id,
      installmentId: installment.id,
      amount: installment.amount,
      purpose: `Installment payment for ${subscription.plan?.catalogItem?.name || 'BNPL'}`,
    });
  };

  const renderSubscription = ({ item }: { item: BnplSubscription }) => {
    const nextInstallment = getNextInstallment(item.installments);
    const progress = item.totalAmount > 0 ? (item.amountPaid / item.totalAmount) * 100 : 0;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('SubscriptionDetail', { subscription: item })}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>
            {item.plan?.catalogItem?.name || 'Subscription'}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${Math.min(progress, 100)}%` }]} />
          </View>
          <Text style={styles.progressText}>{Math.round(progress)}% paid</Text>
        </View>

        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Total</Text>
            <Text style={styles.detailValue}>{formatPrice(item.totalAmount)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Paid</Text>
            <Text style={styles.detailValue}>{formatPrice(item.amountPaid)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Remaining</Text>
            <Text style={[styles.detailValue, { color: '#d9534f' }]}>
              {formatPrice(item.totalAmount - item.amountPaid)}
            </Text>
          </View>
        </View>

        {nextInstallment && (
          <TouchableOpacity
            style={styles.payButton}
            onPress={() => handlePayInstallment(item, nextInstallment)}
          >
            <Text style={styles.payButtonText}>
              Pay Installment: {formatPrice(nextInstallment.amount)}
            </Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1a1a2e" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={subscriptions}
        renderItem={renderSubscription}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.emptyText}>No subscriptions yet</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Catalog')}>
              <Text style={styles.browseLink}>Browse the catalog to get started</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  list: { padding: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1a1a2e', flex: 1 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: '700' },
  progressContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  progressBar: { flex: 1, height: 6, backgroundColor: '#e0e0e0', borderRadius: 3, marginRight: 8 },
  progressFill: { height: '100%', backgroundColor: '#1a1a2e', borderRadius: 3 },
  progressText: { fontSize: 12, color: '#666', width: 60, textAlign: 'right' },
  details: { marginBottom: 12 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  detailLabel: { fontSize: 13, color: '#666' },
  detailValue: { fontSize: 13, fontWeight: '600', color: '#333' },
  payButton: { backgroundColor: '#1a1a2e', borderRadius: 8, padding: 12, alignItems: 'center' },
  payButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  emptyText: { fontSize: 16, color: '#999', marginBottom: 4 },
  browseLink: { fontSize: 14, color: '#2563eb', fontWeight: '500', textDecorationLine: 'underline' },
});