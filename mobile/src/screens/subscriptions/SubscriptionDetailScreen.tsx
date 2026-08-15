import { View, Text, FlatList, StyleSheet } from 'react-native';
import { BnplSubscription, BnplInstallment, InstallmentStatus } from '../../types';

export default function SubscriptionDetailScreen({ route }: { route: any }) {
  const subscription: BnplSubscription = route.params.subscription;
  const installments = subscription.installments || [];

  const formatPrice = (price: number | string) => `₦${Number(price || 0).toLocaleString()}`;
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getStatusColor = (status: InstallmentStatus) => {
    switch (status) {
      case InstallmentStatus.PAID: return '#5cb85c';
      case InstallmentStatus.OVERDUE: return '#d9534f';
      default: return '#f0ad4e';
    }
  };

  const renderInstallment = ({ item, index }: { item: BnplInstallment; index: number }) => (
    <View style={[styles.installmentRow, item.status === InstallmentStatus.PAID && styles.paidRow]}>
      <View style={styles.installmentLeft}>
        <Text style={styles.installmentNumber}>#{index + 1}</Text>
        <View>
          <Text style={styles.installmentAmount}>{formatPrice(item.amount)}</Text>
          <Text style={styles.installmentDate}>Due: {formatDate(item.dueDate)}</Text>
        </View>
      </View>
      <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]}>
        <Text style={styles.statusDotText}>
          {item.status === InstallmentStatus.PAID ? '✓' : item.status === InstallmentStatus.OVERDUE ? '!' : '○'}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{subscription.plan?.catalogItem?.name || 'Subscription'}</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total</Text>
            <Text style={styles.summaryValue}>{formatPrice(subscription.totalAmount)}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Paid</Text>
            <Text style={[styles.summaryValue, { color: '#5cb85c' }]}>{formatPrice(subscription.amountPaid)}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Remaining</Text>
            <Text style={[styles.summaryValue, { color: '#d9534f' }]}>{formatPrice(subscription.totalAmount - subscription.amountPaid)}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Installment Schedule</Text>
      <FlatList
        data={installments}
        renderItem={renderInstallment}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#1a1a2e', padding: 24 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryItem: { alignItems: 'center' },
  summaryLabel: { fontSize: 12, color: '#999', marginBottom: 4 },
  summaryValue: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#333', padding: 16, paddingBottom: 8 },
  list: { paddingHorizontal: 16 },
  installmentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
  },
  paidRow: { opacity: 0.7 },
  installmentLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  installmentNumber: { fontSize: 16, fontWeight: 'bold', color: '#1a1a2e', width: 30 },
  installmentAmount: { fontSize: 15, fontWeight: '600', color: '#333' },
  installmentDate: { fontSize: 12, color: '#999', marginTop: 2 },
  statusDot: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  statusDotText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
});