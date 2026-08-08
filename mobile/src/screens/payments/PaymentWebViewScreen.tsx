import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import client from '../../api/client';
import { ENDPOINTS } from '../../constants';

export default function PaymentWebViewScreen({ route, navigation }: { route: any; navigation: any }) {
  const { subscriptionId, installmentId, amount, purpose } = route.params;
  const [processing, setProcessing] = useState(false);

  const formatPrice = (price: number) => `₦${price.toLocaleString()}`;

  const handlePayWithPaystack = async () => {
    setProcessing(true);
    try {
      const { data } = await client.post(`${ENDPOINTS.payments}/initiate`, {
        subscriptionId,
        amount,
        provider: 'paystack',
      });

      // Open Paystack checkout in browser
      const result = await WebBrowser.openAuthSessionAsync(data.authorizationUrl);

      if (result.type === 'success') {
        Alert.alert('Payment Successful', `You have paid ${formatPrice(amount)}`, [
          { text: 'View Receipt', onPress: () => navigation.navigate('PaymentHistory') },
          { text: 'OK', style: 'cancel' },
        ]);
      } else {
        Alert.alert('Payment Cancelled', 'The payment was cancelled. You can try again.');
      }
    } catch (error: any) {
      Alert.alert('Payment Failed', error?.response?.data?.message || 'Something went wrong');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Payment Details</Text>

        <View style={styles.detailRow}>
          <Text style={styles.label}>Purpose</Text>
          <Text style={styles.value}>{purpose}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Amount</Text>
          <Text style={styles.amount}>{formatPrice(amount)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Payment Method</Text>
          <Text style={styles.value}>Paystack (Card, Bank Transfer, USSD)</Text>
        </View>

        <TouchableOpacity
          style={[styles.payButton, processing && styles.payButtonDisabled]}
          onPress={handlePayWithPaystack}
          disabled={processing}
        >
          {processing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.payButtonText}>Pay {formatPrice(amount)} with Paystack</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 24, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 24, textAlign: 'center' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  label: { fontSize: 14, color: '#666' },
  value: { fontSize: 14, color: '#333', fontWeight: '500', flex: 1, textAlign: 'right' },
  amount: { fontSize: 20, fontWeight: '700', color: '#1a1a2e' },
  payButton: { backgroundColor: '#1a1a2e', borderRadius: 12, padding: 18, alignItems: 'center', marginTop: 32 },
  payButtonDisabled: { opacity: 0.6 },
  payButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});