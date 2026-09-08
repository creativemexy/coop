import { useState, useCallback, useEffect } from 'react';
import {
  View, Text, ScrollView, RefreshControl, TouchableOpacity, StyleSheet, Alert, TextInput, Modal, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
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
  const isIOS = Platform.OS === 'ios';

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

  const modalShell = (children: React.ReactNode) => (
    <View style={styles.modalOverlay}>
      {isIOS ? (
        <BlurView intensity={44} tint="light" style={styles.modalGlass}>
          {children}
        </BlurView>
      ) : (
        <View style={styles.modalM3}>{children}</View>
      )}
    </View>
  );

  const renderInvestModal = () => (
    <Modal visible={showInvest} transparent animationType="slide">
      {modalShell(
        <>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Invest in {selectedProduct?.name}</Text>
            <Ionicons name="trending-up" size={22} color="#D97706" />
          </View>
          <View style={styles.roiChip}>
            <Text style={styles.roiChipText}>
              ROI: {selectedProduct?.expectedReturnRate ?? 0}% · Min: {ngn(Number(selectedProduct?.minimumInvestment ?? 0))}
              {selectedProduct?.maximumInvestment != null ? ` · Max: ${ngn(selectedProduct.maximumInvestment)}` : ''}
            </Text>
          </View>
          <TextInput style={styles.input} placeholder="Amount" placeholderTextColor={isIOS ? 'rgba(60,60,67,0.45)' : '#9aa3b2'} value={amount} onChangeText={setAmount} keyboardType="numeric" />
          <Text style={styles.hint}>
            You'll pay by bank transfer to a dedicated account. Your investment is confirmed once the transfer is verified.
          </Text>
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowInvest(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity style={styles.submitBtn} onPress={handleInvest} disabled={submitting}><Text style={styles.submitText}>{submitting ? 'Processing...' : 'Invest'}</Text></TouchableOpacity>
          </View>
        </>,
      )}
    </Modal>
  );

  const renderPayModal = () => (
    <Modal visible transparent animationType="slide">
      {modalShell(
        <>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Pay via Bank Transfer</Text>
            <Ionicons name="swap-horizontal-outline" size={22} color="#D97706" />
          </View>
          <Text style={styles.hint}>
            Transfer <Text style={styles.bold}>{ngn(Number(pay?.instruction.amount))}</Text> to the
            account below using your bank app. Your order will be confirmed once verified.
          </Text>
          <View style={styles.vaBox}>
            <Text style={styles.vaLabel}>{pay?.instruction.bankName}</Text>
            <TouchableOpacity onPress={() => pay && copyNumber(pay.instruction.accountNumber)}>
              <Text style={styles.vaNumberBig}>{pay?.instruction.accountNumber}</Text>
            </TouchableOpacity>
            <Text style={styles.vaName}>{pay?.instruction.accountName}</Text>
            <Text style={styles.vaRef}>Ref: {pay?.instruction.reference}</Text>
          </View>
          <Text style={styles.payMeta}>
            Status: {pay?.instruction.status} ·{' '}
            {pay?.instruction.status === 'credited' ? 'Credited'
              : pay?.instruction.status === 'expired' ? 'Expired'
                : pay?.instruction.expiresAt ? `Transfers expire ${new Date(pay.instruction.expiresAt).toLocaleTimeString()}`
                  : 'Awaiting transfer'}
          </Text>
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setPay(null)}>
              <Text style={styles.cancelText}>Close</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitBtn} onPress={() => pay && checkPayment(pay.orderId)} disabled={checking}>
              <Text style={styles.submitText}>{checking ? 'Checking...' : "I've transferred · Check"}</Text>
            </TouchableOpacity>
          </View>
        </>,
      )}
    </Modal>
  );

  const renderPortfolio = portfolio ? (
    <View style={[styles.portfolioCard, isIOS && styles.portfolioCardGlass]}>
      <View style={styles.portfolioHeader}>
        <Ionicons name="pie-chart-outline" size={18} color={isIOS ? 'rgba(255,255,255,0.8)' : '#E4A42A'} />
        <Text style={[styles.portfolioTitle, !isIOS && { color: '#173F38' }]}>Your Portfolio</Text>
      </View>
      <View style={styles.portfolioGrid}>
        <View style={styles.portfolioItem}>
          <Text style={[styles.portfolioStat, !isIOS && { color: '#173F38' }]}>{ngn(portfolio.currentValue)}</Text>
          <Text style={[styles.portfolioLabel, !isIOS && { color: '#627084' }]}>Portfolio Value</Text>
          <Text style={[styles.portfolioSub, !isIOS && { color: '#94a3b8' }]}>{portfolio.holdingsCount} holding{portfolio.holdingsCount !== 1 ? 's' : ''}</Text>
        </View>
        <View style={styles.portfolioItem}>
          <Text style={[styles.portfolioStat, !isIOS && { color: '#173F38' }]}>{ngn(portfolio.totalInvested)}</Text>
          <Text style={[styles.portfolioLabel, !isIOS && { color: '#627084' }]}>Total Invested</Text>
          <Text style={[styles.portfolioSub, !isIOS && { color: '#94a3b8' }]}>Cost basis</Text>
        </View>
        <View style={styles.portfolioItem}>
          <Text style={[styles.portfolioStat, { color: '#4ADE80' }]}>{ngn(portfolio.totalEarned)}</Text>
          <Text style={[styles.portfolioLabel, !isIOS && { color: '#627084' }]}>Dividends Earned</Text>
        </View>
        <View style={styles.portfolioItem}>
          <Text style={[styles.portfolioStat, { color: (portfolio.unrealizedReturn ?? 0) >= 0 ? '#4ADE80' : '#F87171' }]}>
            {(portfolio.unrealizedReturn ?? 0) >= 0 ? '+' : ''}{ngn(portfolio.unrealizedReturn ?? 0)}
          </Text>
          <Text style={[styles.portfolioLabel, !isIOS && { color: '#627084' }]}>Unrealized P&L</Text>
          <Text style={[styles.portfolioSub, !isIOS && { color: '#94a3b8' }]}>{Number(portfolio.unrealizedReturnPct || 0).toFixed(1)}%</Text>
        </View>
      </View>
    </View>
  ) : null;

  return (
    <LinearGradient
      colors={isIOS ? ['#0A1F1C', '#123A34', '#173F38'] : ['#0E342C', '#173F38', '#1D4A3F']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.background}
    >
      <View style={[styles.blob, styles.blobGold, { top: -90, right: -70 }]} />
      <View style={[styles.blob, styles.blobTeal, { top: '34%', left: -80 }]} />
      <View style={[styles.blob, styles.blobOrange, { bottom: '8%', right: -60 }]} />

      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadProducts} tintColor="#8AB6D6" colors={['#8AB6D6']} />}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Investments</Text>
          <Text style={styles.headerSub}>Grow your savings with Coop funds</Text>
        </View>

        {loading && products.length === 0 ? (
          <View style={styles.center}>
            <Text style={[styles.centerText, isIOS && styles.centerTextGlass]}>Loading investment products…</Text>
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Text style={[styles.centerText, isIOS && styles.centerTextGlass]}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={loadProducts}>
              <Ionicons name="refresh" size={16} color="#173F38" />
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {renderPortfolio}

        {products.length === 0 && !loading && !error ? (
          <View style={styles.center}>
            <Text style={[styles.centerText, isIOS && styles.centerTextGlass]}>No investment products available right now.</Text>
          </View>
        ) : null}

        {products.map((p) => (
          <View key={p.id} style={[styles.card, isIOS && styles.cardGlass]}>
            <View style={styles.cardTop}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.name, !isIOS && { color: '#173F38' }]}>{p.name}</Text>
                <Text style={[styles.desc, isIOS && styles.descGlass]} numberOfLines={2}>{p.description}</Text>
              </View>
              <View style={styles.roiBadge}>
                <Ionicons name="trending-up" size={14} color="#4ADE80" />
                <Text style={styles.roi}>{p.expectedReturnRate ?? 0}%</Text>
              </View>
            </View>
            <View style={styles.meta}>
              <View style={styles.metaItem}>
                <Ionicons name="cash-outline" size={14} color={isIOS ? 'rgba(255,255,255,0.55)' : '#627084'} />
                <Text style={[styles.metaText, isIOS && styles.metaTextGlass]}>Min: {ngn(Number(p.minimumInvestment ?? 0))}</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={14} color={isIOS ? 'rgba(255,255,255,0.55)' : '#627084'} />
                <Text style={[styles.metaText, isIOS && styles.metaTextGlass]}>Duration: {p.tenorDays ?? '-'} days</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.investBtn} onPress={() => openInvest(p)} activeOpacity={0.85}>
              <Ionicons name="add" size={18} color="#173F38" />
              <Text style={styles.investBtnText}>Invest Now</Text>
            </TouchableOpacity>
          </View>
        ))}

        {renderInvestModal()}
        {pay && renderPayModal()}
      </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  safeArea: { flex: 1 },
  container: { flex: 1 },
  blob: { position: 'absolute', width: 260, height: 260, borderRadius: 130 },
  blobGold: { backgroundColor: 'rgba(228,164,42,0.16)' },
  blobTeal: { backgroundColor: 'rgba(56,180,150,0.14)' },
  blobOrange: { backgroundColor: 'rgba(200,91,35,0.14)' },
  content: { paddingBottom: 32 },
  header: { padding: 20, paddingBottom: 8 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#ffffff' },
  headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.65)', marginTop: 4 },
  center: { alignItems: 'center', paddingVertical: 64, paddingHorizontal: 24 },
  centerText: { fontSize: 15, color: '#627084', textAlign: 'center', marginBottom: 16 },
  centerTextGlass: { color: 'rgba(255,255,255,0.65)' },
  retryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#F6F3EB', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14,
  },
  retryText: { color: '#173F38', fontWeight: '700' },
  portfolioCard: {
    backgroundColor: '#F6F3EB', borderRadius: 20, margin: 20, marginBottom: 8, padding: 18,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  portfolioCardGlass: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
    overflow: 'hidden',
  },
  portfolioHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  portfolioTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  portfolioGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  portfolioItem: { flexBasis: '45%', flexGrow: 1 },
  portfolioStat: { color: '#fff', fontSize: 17, fontWeight: '800' },
  portfolioLabel: { color: '#DCECF7', fontSize: 12, marginTop: 2 },
  portfolioSub: { color: '#95B4CC', fontSize: 11, marginTop: 2 },
  card: {
    backgroundColor: '#F6F3EB', marginHorizontal: 20, marginBottom: 10, padding: 18, borderRadius: 18,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardGlass: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
    overflow: 'hidden',
  },
  cardTop: { flexDirection: 'row', gap: 12, marginBottom: 10 },
  name: { fontSize: 18, fontWeight: '800', color: '#ffffff' },
  desc: { fontSize: 13, color: '#627084', marginTop: 3, lineHeight: 18 },
  descGlass: { color: 'rgba(255,255,255,0.65)' },
  roiBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(74,222,128,0.16)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999,
    alignSelf: 'flex-start',
  },
  roi: { fontSize: 15, fontWeight: '800', color: '#4ADE80' },
  meta: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontSize: 12, color: '#627084', fontWeight: '500' },
  metaTextGlass: { color: 'rgba(255,255,255,0.6)' },
  investBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: '#E4A42A', padding: 14, borderRadius: 14,
  },
  investBtnText: { color: '#173F38', fontWeight: '700', fontSize: 15 },
  modalOverlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 24 },
  modalGlass: {
    borderRadius: 24, padding: 24,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)',
    overflow: 'hidden',
  },
  modalM3: {
    backgroundColor: '#F6F3EB', borderRadius: 24, padding: 24,
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 20, shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#173F38', flex: 1 },
  roiChip: {
    backgroundColor: 'rgba(228,164,42,0.16)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 14,
  },
  roiChipText: { fontSize: 13, color: '#92400E', fontWeight: '600' },
  input: {
    backgroundColor: '#ffffff', borderRadius: 14, padding: 15, fontSize: 16, marginBottom: 12,
    borderWidth: 1.5, borderColor: '#E2E8F0', color: '#173F38',
  },
  hint: { fontSize: 13, color: '#475569', marginBottom: 16, lineHeight: 18 },
  bold: { fontWeight: '700', color: '#173F38' },
  modalActions: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 14, backgroundColor: '#E5EDEA', alignItems: 'center' },
  cancelText: { color: '#475569', fontWeight: '600' },
  submitBtn: { flex: 1, padding: 14, borderRadius: 14, backgroundColor: '#173F38', alignItems: 'center' },
  submitText: { color: '#ffffff', fontWeight: '700' },
  vaBox: { backgroundColor: '#E5EDEA', borderRadius: 16, padding: 16, marginBottom: 12 },
  vaLabel: { fontSize: 13, color: '#627084', fontWeight: '500' },
  vaNumberBig: { fontSize: 24, fontWeight: '800', color: '#173F38', letterSpacing: 1.5, marginTop: 4 },
  vaName: { fontSize: 13, color: '#334155', marginTop: 2 },
  vaRef: { fontSize: 12, color: '#94a3b8', marginTop: 8 },
  payMeta: { fontSize: 13, color: '#627084', marginBottom: 16, textAlign: 'center' },
});