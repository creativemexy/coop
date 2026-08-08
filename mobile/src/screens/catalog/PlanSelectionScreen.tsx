import { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import client from '../../api/client';
import { ENDPOINTS } from '../../constants';
import { BnplPlan, BnplCatalogItem } from '../../types';

export default function PlanSelectionScreen({ route, navigation }: { route: any; navigation: any }) {
  const catalogItem: BnplCatalogItem = route.params.catalogItem;
  const [plans, setPlans] = useState<BnplPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const { data } = await client.get(ENDPOINTS.plans);
        const filtered = Array.isArray(data)
          ? data.filter((p: BnplPlan) => p.catalogItemId === catalogItem.id && p.status === 'active')
          : [];
        setPlans(filtered);
      } catch {
        Alert.alert('Error', 'Failed to load plans');
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, [catalogItem.id]);

  const handleSubscribe = async (planId: string) => {
    setSubscribing(planId);
    try {
      const { data } = await client.post(ENDPOINTS.subscriptions, { planId });
      Alert.alert('Success', 'You have subscribed to this plan!', [
        { text: 'View Subscriptions', onPress: () => navigation.navigate('Subscriptions') },
        { text: 'OK', style: 'cancel' },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to subscribe');
    } finally {
      setSubscribing(null);
    }
  };

  const formatPrice = (price: number) => `₦${price.toLocaleString()}`;

  const renderPlan = ({ item }: { item: BnplPlan }) => {
    const totalInterest = catalogItem.price * (item.interestRate / 100);
    const totalAmount = catalogItem.price + totalInterest;
    const downPayment = catalogItem.price * (item.downPaymentPercent / 100);
    const installmentAmount = (totalAmount - downPayment) / item.installmentCount;

    return (
      <View style={styles.planCard}>
        <Text style={styles.planTitle}>
          {item.installmentCount}x {item.installmentFrequency}
        </Text>
        <View style={styles.planDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Item Price</Text>
            <Text style={styles.detailValue}>{formatPrice(catalogItem.price)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Interest ({item.interestRate}%)</Text>
            <Text style={styles.detailValue}>{formatPrice(totalInterest)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Down Payment ({item.downPaymentPercent}%)</Text>
            <Text style={styles.detailValue}>{formatPrice(downPayment)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Installment</Text>
            <Text style={styles.detailValue}>{formatPrice(installmentAmount)} / {item.installmentFrequency}</Text>
          </View>
          <View style={[styles.detailRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatPrice(totalAmount)}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.subscribeButton}
          onPress={() => handleSubscribe(item.id)}
          disabled={subscribing === item.id}
        >
          {subscribing === item.id ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.subscribeText}>Choose This Plan</Text>
          )}
        </TouchableOpacity>
      </View>
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
      <View style={styles.itemHeader}>
        <Text style={styles.itemName}>{catalogItem.name}</Text>
        <Text style={styles.itemPrice}>{formatPrice(catalogItem.price)}</Text>
      </View>
      <FlatList
        data={plans}
        renderItem={renderPlan}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No plans available for this item</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  itemHeader: { backgroundColor: '#1a1a2e', padding: 24 },
  itemName: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  itemPrice: { fontSize: 18, color: '#4a90d9', fontWeight: '600' },
  list: { padding: 16 },
  planCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  planTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 16 },
  planDetails: { marginBottom: 16 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  detailLabel: { fontSize: 14, color: '#666' },
  detailValue: { fontSize: 14, color: '#333', fontWeight: '500' },
  totalRow: { borderTopWidth: 1, borderColor: '#e0e0e0', marginTop: 8, paddingTop: 8 },
  totalLabel: { fontSize: 16, fontWeight: 'bold', color: '#1a1a2e' },
  totalValue: { fontSize: 16, fontWeight: 'bold', color: '#1a1a2e' },
  subscribeButton: { backgroundColor: '#1a1a2e', borderRadius: 12, padding: 14, alignItems: 'center' },
  subscribeText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  emptyText: { fontSize: 16, color: '#999', textAlign: 'center', marginTop: 40 },
});