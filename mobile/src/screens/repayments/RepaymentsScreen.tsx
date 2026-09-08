import { useState, useCallback, useEffect } from 'react';
import {
  View, Text, ScrollView, RefreshControl, TouchableOpacity, StyleSheet, Alert, Modal, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as WebBrowser from 'expo-web-browser';
import { useFocusEffect } from '@react-navigation/native';
import client, { getErrorMessage } from '../../api/client';
import { ENDPOINTS } from '../../constants';
import { RepaymentData, RepaymentItem, DepositInstruction } from '../../types';

export default function RepaymentsScreen({ navigation }: { navigation: any }) {
  const [data, setData] = useState<RepaymentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const [pay, setPay] = useState<{ repaymentId: string; pending: DepositInstruction } | null>(null);
  const [payingBnpl, setPayingBnpl] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const isIOS = Platform.OS === 'ios';

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data: res } = await client.get(ENDPOINTS.dashboard.repayments);
      setData(res);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const checkLoanRepayment = useCallback(async (repaymentId: string) => {
    try {
      const { data } = await client.post(ENDPOINTS.virtualAccounts.loanRepayVerify(repaymentId));
      const d: DepositInstruction = data;
      setPay((prev) => prev && d ? { repaymentId, pending: d } : prev);
      if (d && d.status === 'credited') {
        setPay(null);
        Alert.alert('Success', `Repayment received (${d.reference})`);
        load(true);
      }
    } catch { /* keep modal open; re-poll */ }
  }, [load]);

  useEffect(() => {
    if (!pay || pay.pending.status !== 'pending') return;
    const t = setInterval(() => checkLoanRepayment(pay.repaymentId), 5000);
    return () => clearInterval(t);
  }, [pay?.pending.status, pay?.pending.id, checkLoanRepayment]);

  const handlePayLoan = async (repaymentId: string) => {
    try {
      const { data } = await client.post(ENDPOINTS.virtualAccounts.loanRepayInitiate(repaymentId));
      const pending: DepositInstruction = data;
      setPay({ repaymentId, pending });
    } catch (e: any) { Alert.alert('Error', getErrorMessage(e, 'Could not start payment')); }
  };

  const handlePayBnpl = async (item: RepaymentItem) => {
    if (!item.subscriptionId) { Alert.alert('Error', 'This installment has no subscription to bill'); return; }
    setPayingBnpl(true);
    try {
      const { data } = await client.post(`${ENDPOINTS.payments}/initiate`, {
        subscriptionId: item.subscriptionId,
        amount: Number(item.amount) + Number(item.lateFee || 0),
        provider: 'paystack',
        purpose: `Installment repayment`,
      });
      const result = await WebBrowser.openAuthSessionAsync(data.authorizationUrl);
      if (result.type === 'success') {
        Alert.alert('Success', 'Installment payment completed.');
        load(true);
      } else {
        Alert.alert('Payment Cancelled', 'The payment was cancelled. You can try again.');
      }
    } catch (e: any) {
      Alert.alert('Payment Failed', getErrorMessage(e, 'Something went wrong'));
    } finally { setPayingBnpl(false); }
  };

  const copyNumber = async (number: string) => {
    try {
      await Clipboard.setStringAsync(number);
      setCopied(number);
      setTimeout(() => setCopied(null), 2000);
    } catch { /* ignore */ }
  };

  const ngn = (n: number) => `₦${Number(n || 0).toLocaleString()}`;

  const items = tab === 'upcoming' ? data?.upcoming ?? [] : data?.past ?? [];

  const statusColor = (item: RepaymentItem) =>
    item.status === 'paid' ? '#4ADE80' : item.isOverdue ? '#F87171' : '#FACC15';

  const renderItem = (item: RepaymentItem) => {
    const canPay = item.status !== 'paid';
    const total = Number(item.amount) + Number(item.lateFee || 0);
    return (
      <View key={item.id} style={[styles.itemCard, isIOS && styles.itemCardGlass]}>
        <View style={styles.itemHeader}>
          <View style={styles.itemIcon}>
            <Ionicons
              name={item.type === 'loan' ? 'card-outline' : 'bag-handle-outline'}
              size={20}
              color={isIOS ? 'rgba(255,255,255,0.85)' : '#0F766E'}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.itemName, !isIOS && { color: '#173F38' }]} numberOfLines={1}>{item.itemName}</Text>
            <View style={styles.itemMetaRow}>
              <Text style={[styles.itemType, { color: item.type === 'loan' ? '#A78BFA' : '#38BDF8' }]}>
                {item.type === 'loan' ? 'Loan' : 'BNPL'}
              </Text>
              <Text style={[styles.itemDue, isIOS && styles.itemDueGlass]}>
                Due {new Date(item.dueDate).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.amountRow}>
          <View>
            <Text style={[styles.amountLabel, isIOS && styles.itemDueGlass]}>Amount</Text>
            <Text style={[styles.itemAmount, !isIOS && { color: '#173F38' }]}>{ngn(Number(item.amount))}</Text>
            {Number(item.lateFee || 0) > 0 && (
              <Text style={styles.lateFee}>+{ngn(Number(item.lateFee))} late fee</Text>
            )}
          </View>
          <View style={[styles.statusChip, { backgroundColor: `${statusColor(item)}22` }]}>
            <Text style={[styles.itemStatus, { color: statusColor(item) }]}>
              {item.status === 'paid' ? 'Paid' : item.isOverdue ? 'Overdue' : 'Pending'}
            </Text>
          </View>
        </View>

        {canPay && (
          <TouchableOpacity
            style={[styles.payBtn, item.type === 'loan' ? styles.payBtnLoan : styles.payBtnBnpl]}
            onPress={() => (item.type === 'loan' ? handlePayLoan(item.id) : handlePayBnpl(item))}
            disabled={payingBnpl}
            activeOpacity={0.85}
          >
            <Ionicons
              name={item.type === 'loan' ? 'cash-outline' : 'wallet-outline'}
              size={17}
              color="#173F38"
            />
            <Text style={styles.payBtnText}>
              {item.type === 'loan' ? `Pay ${ngn(total)} · Bank Transfer` : `Pay ${ngn(total)}`}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderPayModal = () => (
    <Modal visible transparent animationType="slide">
      <View style={styles.modalOverlay}>
        {isIOS ? (
          <BlurView intensity={44} tint="light" style={styles.modalGlass}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pay via Bank Transfer</Text>
              <Ionicons name="swap-horizontal-outline" size={22} color="#D97706" />
            </View>
            <Text style={styles.payNote}>
              Transfer <Text style={styles.bold}>{ngn(Number(pay?.pending.amount))}</Text> to the
              account below using your bank app. Your repayment will be recorded once confirmed.
            </Text>
            <View style={styles.vaBox}>
              <Text style={styles.vaLabel}>{pay?.pending.bankName}</Text>
              <TouchableOpacity onPress={() => pay && copyNumber(pay.pending.accountNumber)}>
                <Text style={styles.vaNumberBig}>{pay?.pending.accountNumber}</Text>
              </TouchableOpacity>
              <Text style={styles.vaName}>{pay?.pending.accountName}</Text>
              <Text style={styles.vaRef}>Ref: {pay?.pending.reference}</Text>
            </View>
            <Text style={styles.payMeta}>
              Status: {pay?.pending.status} ·{' '}
              {pay?.pending.status === 'credited' ? 'Credited'
                : pay?.pending.status === 'expired' ? 'Expired'
                  : pay?.pending.expiresAt ? `Transfers expire ${new Date(pay.pending.expiresAt).toLocaleTimeString()}`
                    : 'Awaiting transfer'}
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setPay(null)}>
                <Text style={styles.cancelText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={() => pay && checkLoanRepayment(pay.repaymentId)}>
                <Text style={styles.submitText}>I've transferred · Check</Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        ) : (
          <View style={styles.modalM3}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pay via Bank Transfer</Text>
              <Ionicons name="swap-horizontal-outline" size={22} color="#D97706" />
            </View>
            <Text style={styles.payNote}>
              Transfer <Text style={styles.bold}>{ngn(Number(pay?.pending.amount))}</Text> to the
              account below using your bank app. Your repayment will be recorded once confirmed.
            </Text>
            <View style={styles.vaBox}>
              <Text style={styles.vaLabel}>{pay?.pending.bankName}</Text>
              <TouchableOpacity onPress={() => pay && copyNumber(pay.pending.accountNumber)}>
                <Text style={styles.vaNumberBig}>{pay?.pending.accountNumber}</Text>
              </TouchableOpacity>
              <Text style={styles.vaName}>{pay?.pending.accountName}</Text>
              <Text style={styles.vaRef}>Ref: {pay?.pending.reference}</Text>
            </View>
            <Text style={styles.payMeta}>
              Status: {pay?.pending.status} ·{' '}
              {pay?.pending.status === 'credited' ? 'Credited'
                : pay?.pending.status === 'expired' ? 'Expired'
                  : pay?.pending.expiresAt ? `Transfers expire ${new Date(pay.pending.expiresAt).toLocaleTimeString()}`
                    : 'Awaiting transfer'}
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setPay(null)}>
                <Text style={styles.cancelText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={() => pay && checkLoanRepayment(pay.repaymentId)}>
                <Text style={styles.submitText}>I've transferred · Check</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );

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
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => load()} tintColor="#8AB6D6" colors={['#8AB6D6']} />}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Repayments</Text>
          <Text style={styles.headerSub}>Track and settle your dues</Text>
        </View>

        {data?.summary && (
          <View style={[styles.summaryCard, isIOS && styles.summaryCardGlass]}>
            <View style={styles.summaryTop}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.summaryOutstanding, !isIOS && { color: '#173F38' }]}>
                  {ngn(data.summary.totalOutstanding)}
                </Text>
                <Text style={[styles.summaryLabel, isIOS && styles.itemDueGlass]}>Total outstanding</Text>
              </View>
              <View style={[styles.nextDueBadge]}>
                <Text style={styles.nextDueLabel}>Next due</Text>
                <Text style={styles.nextDueValue}>
                  {data.summary.nextDueDate
                    ? `${ngn(data.summary.nextDueAmount)} · ${new Date(data.summary.nextDueDate).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}`
                    : '—'}
                </Text>
              </View>
            </View>
            <View style={styles.summaryStats}>
              <View style={styles.summaryStat}>
                <Text style={[styles.summaryStatValue, !isIOS && { color: '#173F38' }]}>{data.summary.totalUpcoming}</Text>
                <Text style={[styles.summaryStatLabel, isIOS && styles.itemDueGlass]}>Upcoming</Text>
              </View>
              <View style={styles.summaryStat}>
                <Text style={[styles.summaryStatValue, { color: data.summary.overdueCount > 0 ? '#F87171' : '#4ADE80' }]}>
                  {data.summary.overdueCount}
                </Text>
                <Text style={[styles.summaryStatLabel, isIOS && styles.itemDueGlass]}>Overdue</Text>
              </View>
              <View style={styles.summaryStat}>
                <Text style={[styles.summaryStatValue, !isIOS && { color: '#173F38' }]}>{data.summary.pastPaid}</Text>
                <Text style={[styles.summaryStatLabel, isIOS && styles.itemDueGlass]}>Paid</Text>
              </View>
              <View style={styles.summaryStat}>
                <Text style={[styles.summaryStatValue, !isIOS && { color: '#173F38' }]}>{ngn(data.summary.loanBalance)}</Text>
                <Text style={[styles.summaryStatLabel, isIOS && styles.itemDueGlass]}>Loan bal.</Text>
              </View>
            </View>
          </View>
        )}

        <View style={[styles.tabs, isIOS && styles.tabsGlass]}>
          {(['upcoming', 'past'] as const).map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.tab, tab === t && (isIOS ? styles.activeTabGlass : styles.activeTab)]}
              onPress={() => setTab(t)}
              activeOpacity={0.85}
            >
              <Text style={[styles.tabText, tab === t && (isIOS ? styles.activeTabTextGlass : styles.activeTabText)]}>
                {t === 'upcoming' ? 'Upcoming' : 'Paid'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {items.length === 0 && !loading ? (
          <Text style={[styles.emptyText, isIOS && styles.itemDueGlass]}>
            {tab === 'upcoming' ? "Nothing due — you're all caught up." : 'No paid repayments yet.'}
          </Text>
        ) : null}
        {items.map(renderItem)}

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
  summaryCard: {
    backgroundColor: '#F6F3EB', borderRadius: 20, marginHorizontal: 20, padding: 18,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  summaryCardGlass: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
    overflow: 'hidden',
  },
  summaryTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  summaryOutstanding: { fontSize: 26, fontWeight: '800', color: '#ffffff' },
  summaryLabel: { fontSize: 12, color: '#DCECF7', marginTop: 2 },
  nextDueBadge: {
    backgroundColor: 'rgba(228,164,42,0.18)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8,
  },
  nextDueLabel: { fontSize: 10, color: '#B45309', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  nextDueValue: { fontSize: 13, color: '#78350F', fontWeight: '700', marginTop: 2 },
  summaryStats: { flexDirection: 'row', gap: 8 },
  summaryStat: { flex: 1 },
  summaryStatValue: { fontSize: 16, fontWeight: '800', color: '#ffffff' },
  summaryStatLabel: { fontSize: 10, color: '#DCECF7', marginTop: 2 },
  tabs: {
    flexDirection: 'row', marginHorizontal: 20, marginTop: 16, marginBottom: 12,
    backgroundColor: '#E5EDEA', borderRadius: 14, padding: 4,
  },
  tabsGlass: { backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  activeTab: { backgroundColor: '#173F38' },
  activeTabGlass: { backgroundColor: 'rgba(255,255,255,0.22)' },
  tabText: { color: '#475569', fontWeight: '600' },
  activeTabText: { color: '#ffffff' },
  activeTabTextGlass: { color: '#ffffff' },
  emptyText: { fontSize: 14, color: '#627084', textAlign: 'center', paddingVertical: 40, paddingHorizontal: 20 },
  itemCard: {
    backgroundColor: '#F6F3EB', marginHorizontal: 20, marginBottom: 10, padding: 18, borderRadius: 18,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  itemCardGlass: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
    overflow: 'hidden',
  },
  itemHeader: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  itemIcon: {
    width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  itemName: { fontSize: 16, fontWeight: '700', color: '#ffffff' },
  itemMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3 },
  itemType: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  itemDue: { fontSize: 12, color: '#627084' },
  itemDueGlass: { color: 'rgba(255,255,255,0.6)' },
  amountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  amountLabel: { fontSize: 11, color: '#627084', fontWeight: '500' },
  itemAmount: { fontSize: 20, fontWeight: '800', color: '#ffffff', marginTop: 2 },
  lateFee: { fontSize: 12, color: '#F87171', fontWeight: '600', marginTop: 2 },
  statusChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  itemStatus: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  payBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    marginTop: 14, padding: 13, borderRadius: 14,
  },
  payBtnLoan: { backgroundColor: '#4ADE80' },
  payBtnBnpl: { backgroundColor: '#E4A42A' },
  payBtnText: { color: '#173F38', fontWeight: '700', fontSize: 14 },
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
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#173F38', flex: 1 },
  payNote: { fontSize: 14, color: '#475569', marginBottom: 16, lineHeight: 20 },
  bold: { fontWeight: '700', color: '#173F38' },
  vaBox: { backgroundColor: '#E5EDEA', borderRadius: 16, padding: 16, marginBottom: 12 },
  vaLabel: { fontSize: 13, color: '#627084', fontWeight: '500' },
  vaNumberBig: { fontSize: 24, fontWeight: '800', color: '#173F38', letterSpacing: 1.5, marginTop: 4 },
  vaName: { fontSize: 13, color: '#334155', marginTop: 2 },
  vaRef: { fontSize: 12, color: '#94a3b8', marginTop: 8 },
  payMeta: { fontSize: 13, color: '#627084', marginBottom: 16, textAlign: 'center' },
  modalActions: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 14, backgroundColor: '#E5EDEA', alignItems: 'center' },
  cancelText: { color: '#475569', fontWeight: '600' },
  submitBtn: { flex: 1, padding: 14, borderRadius: 14, backgroundColor: '#173F38', alignItems: 'center' },
  submitText: { color: '#ffffff', fontWeight: '700' },
});