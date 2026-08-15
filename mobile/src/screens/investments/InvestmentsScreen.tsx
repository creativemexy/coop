import { useState, useCallback, useEffect } from 'react';
import {
  View, Text, ScrollView, RefreshControl, TouchableOpacity, StyleSheet, Alert, TextInput, Modal,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useFocusEffect } from '@react-navigation/native';
import client, { getErrorMessage } from '../../api/client';
import { ENDPOINTS } from '../../constants';
import { InvestmentProduct, PortfolioSummary, DepositInstruction } from '../../types';

export default function InvestmentsScreen() {
  const [products, setProducts] = useState<InvestmentProduct[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInvest, setShowInvest] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<InvestmentProduct | null>(null);
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [pay, setPay] = useState<{ orderId: string; instruction: DepositInstruction } | null>(null);
  const [checking, setChecking] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const ngn = (n: number) => `₦${Number(n || 0).toLocaleString()}`;

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [{ data }, port] = await Promise.all([
        client.get(ENDPOINTS.investments.products),
        client.get(ENDPOINTS.investments.portfolio),
      ]);
      setProducts(Array.isArray(data) ? data : []);
      setPortfolio(port.data ?? null);
    } catch (e: any) {
      setProducts([]);
      setError(getErrorMessage(e, 'Could not load investment products.'));
    } finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { loadProducts(); }, [loadProducts]));

  const checkPayment = useCallback(async (orderId: string): Promise<string | 'error'> => {
    setChecking(true);
    try {
      const { data } = await client.post(ENDPOINTS.virtualAccounts.investPaymentVerify(orderId));
      const d: DepositInstruction = data;
      setPay((prev) => prev && d ? { orderId, instruction: d } : prev);
      if (d.status === 'credited') {
        setPay(null);
        setShowInvest(false);
        Alert.alert('Success', `Investment confirmed. Order ${orderId.slice(0, 8)} allocated.`);
      } else if (d.status === 'expired') {
        setPay(null);
        Alert.alert('Expired', 'This payment instruction has expired. Please try again.');
      }
      return d.status;
    } catch { /* keep modal open; re-poll */ return 'error'; }
    finally { setChecking(false); }
  }, []);

  // Self-scheduling poll: the next check only starts after the previous one
  // completes, so slow network calls can never overlap. Bounded attempts,
  // capped exponential backoff, and stop on expiry / error threshold.
  useEffect(() => {
    if (!pay || pay.instruction.status !== 'pending') return;
    const MAX_ATTEMPTS = 30;
    const MAX_CONSECUTIVE_ERRORS = 3;
    const BASE_DELAY = 5000;
    const MAX_DELAY = 30000;

    let cancelled = false;
    let attempts = 0;
    let consecutiveErrors = 0;
    let delay = BASE_DELAY;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const poll = async () => {
      if (cancelled) return;
      attempts += 1;
      const status = await checkPayment(pay.orderId);
      if (cancelled) return;
      if (status === 'credited' || status === 'expired') return;
      if (status === 'error') {
        consecutiveErrors += 1;
      } else if (status !== 'pending') {
        return;
      } else {
        consecutiveErrors = 0;
      }
      if (attempts >= MAX_ATTEMPTS || consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
        setPay(null);
        Alert.alert('Timed out', 'Payment confirmation has timed out. Check your account and try again.');
        return;
      }
      delay = Math.min(delay * 1.5, MAX_DELAY);
      timer = setTimeout(poll, delay);
    };

    timer = setTimeout(poll, BASE_DELAY);
    return () => { cancelled = true; if (timer) clearTimeout(timer); };
  }, [pay?.instruction.status, pay?.instruction.id, checkPayment]);

  const openInvest = (p: InvestmentProduct) => { setSelectedProduct(p); setAmount(''); setShowInvest(true); };

  const handleInvest = async () => {
    const amt = Number(amount);
    if (!amount || isNaN(amt) || amt < (selectedProduct?.minimumInvestment ?? 0)) {
      Alert.alert('Error', `Minimum: ₦${(selectedProduct?.minimumInvestment ?? 0).toLocaleString()}`);
      return;
    }
    if (selectedProduct?.maximumInvestment != null && amt > selectedProduct.maximumInvestment) {
      Alert.alert('Error', `Maximum: ₦${selectedProduct.maximumInvestment.toLocaleString()}`);
      return;
    }
    setSubmitting(true);
    try {
      const { data: order } = await client.post(ENDPOINTS.investments.invest, {
        productId: selectedProduct!.id,
        amount: Number(amount),
      });
      const { data } = await client.post(ENDPOINTS.virtualAccounts.investPaymentInitiate(order.id));
      const d: DepositInstruction = data;
      setShowInvest(false);
      setPay({ orderId: order.id, instruction: d });
    } catch (e: any) { Alert.alert('Error', getErrorMessage(e, 'Failed')); }
    finally { setSubmitting(false); }
  };

  const copyNumber = async (number: string) => {
    try {
      await Clipboard.setStringAsync(number);
      setCopied(number);
      setTimeout(() => setCopied(null), 2000);
    } catch { /* ignore */ }
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={loadProducts} />
      }>
      {loading && products.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.centerText}>Loading investment products…</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.centerText}>{error}</Text>
          <TouchableOpacity style={styles.investBtn} onPress={loadProducts}>
            <Text style={styles.investBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}
      {portfolio ? (
        <View style={styles.portfolioCard}>
          <Text style={styles.portfolioTitle}>Your Portfolio</Text>
          <View style={styles.portfolioGrid}>
            <View style={styles.portfolioItem}>
              <Text style={styles.portfolioStat}>{ngn(portfolio.currentValue)}</Text>
              <Text style={styles.portfolioLabel}>Portfolio Value</Text>
              <Text style={styles.portfolioSub}>{portfolio.holdingsCount} holding{portfolio.holdingsCount !== 1 ? 's' : ''}</Text>
            </View>
            <View style={styles.portfolioItem}>
              <Text style={styles.portfolioStat}>{ngn(portfolio.totalInvested)}</Text>
              <Text style={styles.portfolioLabel}>Total Invested</Text>
              <Text style={styles.portfolioSub}>Cost basis</Text>
            </View>
            <View style={styles.portfolioItem}>
              <Text style={[styles.portfolioStat, { color: '#22c55e' }]}>{ngn(portfolio.totalEarned)}</Text>
              <Text style={styles.portfolioLabel}>Dividends Earned</Text>
            </View>
            <View style={styles.portfolioItem}>
              <Text style={[styles.portfolioStat, { color: (portfolio.unrealizedReturn ?? 0) >= 0 ? '#22c55e' : '#ef4444' }]}>
                {(portfolio.unrealizedReturn ?? 0) >= 0 ? '+' : ''}{ngn(portfolio.unrealizedReturn ?? 0)}
              </Text>
              <Text style={styles.portfolioLabel}>Unrealized P&L</Text>
              <Text style={styles.portfolioSub}>{Number(portfolio.unrealizedReturnPct || 0).toFixed(1)}%</Text>
            </View>
          </View>
        </View>
      ) : null}
      {products.length === 0 && !loading && !error ? (
        <View style={styles.center}>
          <Text style={styles.centerText}>No investment products available right now.</Text>
        </View>
      ) : null}
      {products.map((p) => (
        <View key={p.id} style={styles.card}>
          <Text style={styles.name}>{p.name}</Text>
          <Text style={styles.roi}>{p.expectedReturnRate ?? 0}% ROI</Text>
          <Text style={styles.desc} numberOfLines={2}>{p.description}</Text>
          <View style={styles.meta}>
            <Text style={styles.metaItem}>Min: ₦{Number(p.minimumInvestment ?? 0).toLocaleString()}</Text>
            <Text style={styles.metaItem}>Duration: {p.tenorDays ?? '-'} days</Text>
          </View>
          <TouchableOpacity style={styles.investBtn} onPress={() => openInvest(p)}>
            <Text style={styles.investBtnText}>Invest Now</Text>
          </TouchableOpacity>
        </View>
      ))}

      <Modal visible={showInvest} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Invest in {selectedProduct?.name}</Text>
            <Text style={styles.roiLabel}>
              ROI: {selectedProduct?.expectedReturnRate ?? 0}% | Min: ₦{Number(selectedProduct?.minimumInvestment ?? 0).toLocaleString()}
              {selectedProduct?.maximumInvestment != null ? ` | Max: ₦${selectedProduct.maximumInvestment.toLocaleString()}` : ''}
            </Text>
            <TextInput style={styles.input} placeholder="Amount" placeholderTextColor="#999" value={amount} onChangeText={setAmount} keyboardType="numeric" />
            <Text style={styles.hint}>
              You'll pay by bank transfer to a dedicated account. Your investment is confirmed once the transfer is verified.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowInvest(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleInvest} disabled={submitting}><Text style={styles.submitText}>{submitting ? 'Processing...' : 'Invest'}</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {pay && (
        <Modal visible transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modal}>
              <Text style={styles.modalTitle}>Pay via Bank Transfer</Text>
              <Text style={styles.hint}>
                Transfer <Text style={styles.bold}>₦{Number(pay.instruction.amount).toLocaleString()}</Text> to the
                account below using your bank app. Your order will be confirmed once verified.
              </Text>
              <View style={styles.vaBox}>
                <Text style={styles.vaLabel}>{pay.instruction.bankName}</Text>
                <TouchableOpacity onPress={() => copyNumber(pay.instruction.accountNumber)}>
                  <Text style={styles.vaNumberBig}>{pay.instruction.accountNumber}</Text>
                </TouchableOpacity>
                <Text style={styles.vaName}>{pay.instruction.accountName}</Text>
                <Text style={styles.vaRef}>Ref: {pay.instruction.reference}</Text>
              </View>
              <Text style={styles.payMeta}>
                Status: {pay.instruction.status} ·{' '}
                {pay.instruction.status === 'credited' ? 'Credited'
                  : pay.instruction.status === 'expired' ? 'Expired'
                    : pay.instruction.expiresAt ? `Transfers expire ${new Date(pay.instruction.expiresAt).toLocaleTimeString()}`
                      : 'Awaiting transfer'}
              </Text>
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setPay(null)}>
                  <Text style={styles.cancelText}>Close</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.submitBtn} onPress={() => checkPayment(pay.orderId)} disabled={checking}>
                  <Text style={styles.submitText}>{checking ? 'Checking...' : "I've transferred · Check"}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { alignItems: 'center', paddingVertical: 64, paddingHorizontal: 24 },
  centerText: { fontSize: 15, color: '#666', textAlign: 'center', marginBottom: 16 },
  portfolioCard: { backgroundColor: '#0B3B60', borderRadius: 16, margin: 16, marginBottom: 8, padding: 16 },
  portfolioTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 12 },
  portfolioGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  portfolioItem: { flexBasis: '45%', flexGrow: 1 },
  portfolioStat: { color: '#fff', fontSize: 17, fontWeight: '800' },
  portfolioLabel: { color: '#DCECF7', fontSize: 12, marginTop: 2 },
  portfolioSub: { color: '#95B4CC', fontSize: 11, marginTop: 2 },
  card: { backgroundColor: '#fff', margin: 16, marginBottom: 8, padding: 16, borderRadius: 12, elevation: 1 },
  name: { fontSize: 18, fontWeight: 'bold', color: '#1a1a2e' },
  roi: { fontSize: 24, fontWeight: 'bold', color: '#22c55e', marginVertical: 4 },
  desc: { fontSize: 13, color: '#666', marginBottom: 8 },
  meta: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  metaItem: { fontSize: 12, color: '#999' },
  investBtn: { backgroundColor: '#22c55e', padding: 14, borderRadius: 8, alignItems: 'center' },
  investBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  modalOverlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 24 },
  modal: { backgroundColor: '#fff', borderRadius: 16, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8, color: '#1a1a2e' },
  roiLabel: { fontSize: 14, color: '#666', marginBottom: 16 },
  input: { backgroundColor: '#f5f5f5', borderRadius: 8, padding: 14, fontSize: 16, marginBottom: 12 },
  hint: { fontSize: 13, color: '#666', marginBottom: 16, lineHeight: 18 },
  bold: { fontWeight: '700', color: '#1a1a2e' },
  modalActions: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 8, backgroundColor: '#e5e7eb', alignItems: 'center' },
  cancelText: { color: '#666', fontWeight: '600' },
  submitBtn: { flex: 1, padding: 14, borderRadius: 8, backgroundColor: '#22c55e', alignItems: 'center' },
  submitText: { color: '#fff', fontWeight: '600' },
  vaBox: { backgroundColor: '#f5f5f5', borderRadius: 12, padding: 16, marginBottom: 12 },
  vaLabel: { fontSize: 13, color: '#666' },
  vaNumberBig: { fontSize: 24, fontWeight: 'bold', color: '#1a1a2e', letterSpacing: 1, marginTop: 2 },
  vaName: { fontSize: 13, color: '#333', marginTop: 2 },
  vaRef: { fontSize: 12, color: '#999', marginTop: 8 },
  payMeta: { fontSize: 13, color: '#888', marginBottom: 16, textAlign: 'center' },
});