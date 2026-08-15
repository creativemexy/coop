import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import client, { getErrorMessage } from '../../api/client';
import { ENDPOINTS } from '../../constants';

const REDIRECT = Linking.createURL('paystack');

export default function RegisterFeeScreen({ route, navigation }: { route: any; navigation: any }) {
  const { feeAmount, pendingUserId } = route.params;
  const [fee] = useState(feeAmount as number | null);
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'verifying' | 'paid' | 'failed'>('idle');

  const handlePay = async () => {
    if (!fee) return;
    setProcessing(true);
    try {
      const payload = pendingUserId
        ? { userId: pendingUserId, amount: fee, callbackUrl: REDIRECT }
        : { amount: fee, purpose: 'registration', callbackUrl: REDIRECT };
      const endpoint = pendingUserId ? '/payments/initiate-registration' : '/payments/initiate';
      const { data } = await client.post(`${ENDPOINTS.payments}${endpoint}`, payload);

      if (!data.authorizationUrl) {
        Alert.alert('Payment', 'Unable to start payment. Please try again.');
        return;
      }

      const result = await WebBrowser.openAuthSessionAsync(data.authorizationUrl, REDIRECT);

      if (result.type === 'success') {
        const ref = extractReference(result.url);
        setStatus('verifying');
        await verifyAndComplete(ref);
      } else {
        setStatus('failed');
        Alert.alert('Payment Cancelled', 'The payment did not complete. Please try again.');
      }
    } catch (error: any) {
      setStatus('failed');
      Alert.alert('Payment Failed', getErrorMessage(error, 'Failed to initiate payment.'));
    } finally {
      setProcessing(false);
    }
  };

  const verifyAndComplete = async (ref?: string | null) => {
    try {
      if (ref) {
        await client.get(ENDPOINTS.verifyPayment(ref));
      }
      setStatus('paid');
    } catch {
      setStatus('failed');
      Alert.alert(
        'Payment Not Confirmed',
        'We could not confirm your payment. Your activation may take a moment. Please check your email and log in once activated.',
      );
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          {status === 'paid' ? (
            <>
              <Text style={[styles.title, { color: '#16a34a' }]}>Fee Paid</Text>
              <Text style={styles.subtitle}>
                Your registration fee has been paid and your account is being activated. You can now log in.
              </Text>
              <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Login')}>
                <Text style={styles.buttonText}>Go to Login</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.title}>Registration Fee</Text>
              <Text style={styles.subtitle}>
                Pay your one-time membership fee to complete your registration and activate your account. This
                payment is required — your registration cannot be completed without it.
              </Text>

              <Text style={styles.amount}>{fare(fee ?? 0)}</Text>

              {status === 'verifying' && (
                <View style={styles.verifying}>
                  <ActivityIndicator color="#1a1a2e" />
                  <Text style={styles.verifyingText}>Confirming your payment... Please wait.</Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.button, (processing || !fee || status === 'verifying') && styles.buttonDisabled]}
                onPress={handlePay}
                disabled={processing || !fee || status === 'verifying'}
              >
                {processing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>
                    {status === 'failed' ? 'Try Again — Pay ' : 'Pay '}
                    {fare(fee ?? 0)}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.cancelButton, (processing || status === 'verifying') && styles.buttonDisabled]}
                onPress={() => navigation.navigate('Login')}
                disabled={processing || status === 'verifying'}
              >
                <Text style={styles.cancelButtonText}>Cancel Registration</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function extractReference(url: string): string | null {
  const m = url.match(/[?&]reference=([^&]+)/);
  return m?.[1] ? decodeURIComponent(m[1]) : null;
}

function fare(price: number) {
  return `₦${price.toLocaleString()}`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 12, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  amount: { fontSize: 40, fontWeight: '700', color: '#1a1a2e', textAlign: 'center', marginBottom: 28 },
  button: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700', textAlign: 'center' },
  cancelButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 4,
  },
  cancelButtonText: { color: '#1a1a2e', fontSize: 16, fontWeight: '600' },
  verifying: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 16 },
  verifyingText: { fontSize: 14, color: '#4b5563' },
});