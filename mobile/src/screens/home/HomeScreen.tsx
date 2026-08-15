import { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, RefreshControl, TouchableOpacity, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useFocusEffect } from '@react-navigation/native';
import client from '../../api/client';
import { ENDPOINTS } from '../../constants';
import { DashboardData, UnifiedTransaction } from '../../types';
import AdBanner from '../../components/AdBanner';
import { useBranding } from '../../hooks/useBranding';
import { colors, layout } from '../../ui/theme';

type IconName = keyof typeof Ionicons.glyphMap;

const quickActions: { key: string; label: string; icon: IconName; screen: string }[] = [
  { key: 'Savings', label: 'Savings', icon: 'wallet-outline', screen: 'Savings' },
  { key: 'Loans', label: 'Loans', icon: 'cash-outline', screen: 'Loans' },
  { key: 'Investments', label: 'Investments', icon: 'trending-up-outline', screen: 'Investments' },
  { key: 'Repayments', label: 'Repayments', icon: 'calendar-outline', screen: 'Repayments' },
];

export default function HomeScreen({ navigation }: { navigation: any }) {
  const user = useAuthStore((s) => s.user);
  const branding = useBranding();
  const [data, setData] = useState<DashboardData | null>(null);
  const [txns, setTxns] = useState<UnifiedTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    try {
      const { data: res } = await client.get(ENDPOINTS.dashboard.individual);
      setData(res);
    } catch { /* ignore */ }
    try {
      const { data: tx } = await client.get(ENDPOINTS.dashboard.transactions);
      setTxns(Array.isArray(tx) ? tx.slice(0, 5) : []);
    } catch { /* ignore */ }
    finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchDashboard(); }, [fetchDashboard]));

  const ngn = (n: number) => `₦${Number(n || 0).toLocaleString()}`;

  const kycColors: Record<string, string> = {
    approved: '#22c55e', pending: '#eab308', rejected: '#ef4444', none: '#9ca3af',
  };

  const savingsProgress = data && data.savingsTarget > 0
    ? Math.min(100, (data.goalBalance / data.savingsTarget) * 100)
    : 0;

  const bnplPercent = data && data.bnplCreditLimit > 0 ? (data.bnplUsed / data.bnplCreditLimit) * 100 : 0;

  const kycBanner = () => {
    const kyc = data?.kycStatus ?? user?.kycStatus;
    if (!kyc) return null;
    if (kyc === 'approved') {
      return (
        <View style={[styles.kycBanner, { backgroundColor: '#dcfce7' }]}>
          <Text style={[styles.kycBannerText, { color: '#166534' }]}>KYC verified</Text>
        </View>
      );
    }
    const isPending = kyc === 'pending';
    const isRejected = kyc === 'rejected';
    return (
      <TouchableOpacity
        style={[styles.kycBanner, { backgroundColor: isRejected ? '#fee2e2' : isPending ? '#e0f2fe' : '#fef3c7' }]}
        onPress={() => navigation.navigate('KYCVerification')}
      >
        <Text style={[styles.kycBannerText, { color: isRejected ? '#b91c1c' : isPending ? '#075985' : '#92400e' }]}>
          {kyc === 'none' ? 'Complete your KYC verification to access all features' :
           isPending ? 'KYC verification pending review' :
           'KYC verification rejected. Tap to retry'}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchDashboard} tintColor={colors.brand} accessibilityLabel="Refresh dashboard" />}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Welcome, {user?.firstName || 'User'}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        {branding?.organizationName && branding.organizationName !== 'Coop BNPL' ? (
          <Text style={styles.orgName}>{branding.organizationName}</Text>
        ) : null}
      </View>

      {kycBanner()}

      <View style={styles.quickActions}>
        {quickActions.map((a) => (
          <TouchableOpacity
            key={a.key}
            accessibilityRole="button"
            style={styles.quickAction}
            onPress={() => navigation.navigate('Profile', { screen: a.screen, params: a.key === 'Withdraw' ? { openWithdraw: true } : undefined })}
          >
            <View style={styles.quickIcon}>
              <Ionicons name={a.icon} size={22} color={colors.brand} />
            </View>
            <Text style={styles.quickLabel}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.cardsRow}>
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Subscriptions')}>
          <Text style={styles.cardValue}>{data?.activeSubscriptions ?? 0}</Text>
          <Text style={styles.cardLabel}>Active Subscriptions</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Profile', { screen: 'Repayments' })}>
          <Text style={styles.cardValue}>{data?.nextPaymentAmount ? ngn(data.nextPaymentAmount) : '₦0'}</Text>
          <Text style={styles.cardLabel}>Next Payment</Text>
          <Text style={styles.cardSub}>
            {data?.nextPaymentDate ? `Due ${new Date(data.nextPaymentDate).toLocaleDateString()}` : 'No upcoming'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Savings</Text>
        <View style={styles.row}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{ngn(data?.savingsBalance ?? 0)}</Text>
            <Text style={styles.statLabel}>General</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{ngn(data?.goalBalance ?? 0)}</Text>
            <Text style={styles.statLabel}>Goal</Text>
          </View>
        </View>
        {data && data.savingsTarget > 0 ? (
          <View style={styles.progressWrap}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Target: {ngn(data.savingsTarget)}</Text>
              <Text style={styles.progressPct}>{Math.round(savingsProgress)}%</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${savingsProgress}%` }]} />
            </View>
          </View>
        ) : null}
        <TouchableOpacity style={styles.link} onPress={() => navigation.navigate('Profile', { screen: 'Savings' })}>
          <Text style={styles.linkText}>Manage Savings →</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Loans</Text>
        <View style={styles.row}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{data?.activeLoans ?? 0}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{ngn(data?.totalOutstanding ?? 0)}</Text>
            <Text style={styles.statLabel}>Outstanding</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.link} onPress={() => navigation.navigate('Profile', { screen: 'Loans' })}>
          <Text style={styles.linkText}>Apply / View Loans →</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>BNPL Available Credit</Text>
        {data && !data.bnplEligible ? (
          <>
            <Text style={styles.statValue}>Not yet eligible</Text>
            <Text style={styles.statLabel}>Save consistently to unlock BNPL credit</Text>
          </>
        ) : (
          <>
            <Text style={[styles.statValue, { color: '#8b5cf6' }]}>{data ? ngn(data.bnplAvailable) : '—'}</Text>
            {data && (
              <View style={styles.progressWrap}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>{ngn(data.bnplUsed)} used</Text>
                  <Text style={styles.progressPct}>Limit: {ngn(data.bnplCreditLimit)}</Text>
                </View>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFillPurple, { width: `${bnplPercent}%` }]} />
                </View>
              </View>
            )}
          </>
        )}
        <TouchableOpacity style={styles.link} onPress={() => navigation.navigate('Catalog')}>
          <Text style={styles.linkText}>Shop Now →</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <View style={styles.activityHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Profile', { screen: 'Transactions' })}>
            <Text style={styles.linkText}>View All</Text>
          </TouchableOpacity>
        </View>
        {txns.length === 0 && <Text style={styles.emptyText}>No transactions yet</Text>}
        {txns.map((t, i) => (
          <View key={`${t.reference}-${i}`} style={styles.txnRow}>
            <View style={styles.left}>
              <View style={[styles.dot, { backgroundColor: typeColors[t.type] || '#666' }]} />
              <View style={styles.leftText}>
                <Text style={styles.txnType}>{(typeLabels[t.type] ?? t.type.replace(/_/g, ' '))}</Text>
                <Text style={styles.txnDesc} numberOfLines={1}>{t.description || t.reference}</Text>
                <Text style={styles.txnDate}>{new Date(t.date).toLocaleDateString()}</Text>
              </View>
            </View>
            <View style={styles.right}>
              <Text style={[styles.amount, { color: t.amount >= 0 ? '#22c55e' : '#ef4444' }]}>
                {t.amount >= 0 ? '+' : ''}{ngn(Math.abs(t.amount))}
              </Text>
              <Text style={[styles.status, { color: t.status === 'success' || t.status === 'paid' || t.status === 'completed' ? '#22c55e' : t.status === 'pending' || t.status === 'overdue' ? '#eab308' : '#ef4444' }]}>{t.status}</Text>
            </View>
          </View>
        ))}
      </View>

      <AdBanner />
    </ScrollView>
  );
}

const typeColors: Record<string, string> = {
  savings_deposit: '#22c55e', savings_withdrawal: '#ef4444', savings_interest: '#22c55e',
  payment: '#2563eb', installment: '#8b5cf6', loan_due: '#eab308', loan_repayment: '#22c55e',
};

const typeLabels: Record<string, string> = {
  savings_deposit: 'Savings Deposit', savings_withdrawal: 'Savings Withdrawal', savings_interest: 'Savings Interest',
  payment: 'Subscription Payment', installment: 'Installment Due', loan_due: 'Loan Due', loan_repayment: 'Loan Repayment',
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background }, content: { paddingBottom: 28 },
  header: { backgroundColor: colors.brandDark, padding: layout.pagePadding, paddingTop: 16, paddingBottom: 28, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  greeting: { fontSize: 24, fontWeight: '800', color: '#fff' },
  email: { fontSize: 14, color: '#DCECF7', marginTop: 4 },
  orgName: { fontSize: 12, color: '#cfd8e3', marginTop: 2, fontWeight: '500' },
  kycBanner: { padding: 13, marginHorizontal: layout.pagePadding, marginTop: 16, borderRadius: 12 },
  kycBannerText: { fontSize: 13, textAlign: 'center' },
  quickActions: { flexDirection: 'row', paddingHorizontal: layout.pagePadding, marginTop: 16, gap: 10 },
  quickAction: { flex: 1, backgroundColor: '#fff', borderRadius: layout.radius, paddingVertical: 14, alignItems: 'center', gap: 8, ...layout.shadow },
  quickIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EAF4FA' },
  quickLabel: { fontSize: 12, fontWeight: '700', color: colors.text },
  cardsRow: { flexDirection: 'row', paddingHorizontal: layout.pagePadding, gap: 12, marginTop: 16 },
  card: { flex: 1, backgroundColor: '#fff', borderRadius: layout.radius, padding: 16, ...layout.shadow },
  cardValue: { fontSize: 22, fontWeight: '800', color: colors.text },
  cardLabel: { fontSize: 13, color: colors.muted, marginTop: 4 },
  cardSub: { fontSize: 11, color: colors.muted, marginTop: 3 },
  section: { backgroundColor: '#fff', marginHorizontal: layout.pagePadding, marginTop: 16, borderRadius: layout.radius, padding: 16, ...layout.shadow },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 12 },
  row: { flexDirection: 'row', gap: 16 },
  statItem: { flex: 1 },
  statValue: { fontSize: 18, fontWeight: '700', color: colors.text },
  statLabel: { fontSize: 13, color: colors.muted, marginTop: 2 },
  green: { color: '#22c55e' },
  red: { color: '#ef4444' },
  link: { marginTop: 12 },
  linkText: { color: colors.brand, fontSize: 14, fontWeight: '700' },
  progressWrap: { marginTop: 12 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  progressLabel: { fontSize: 12, color: colors.muted },
  progressPct: { fontSize: 12, color: colors.muted },
  progressTrack: { width: '100%', backgroundColor: '#e5e7eb', borderRadius: 4, height: 8, overflow: 'hidden' },
  progressFill: { height: 8, backgroundColor: '#2563eb', borderRadius: 4 },
  progressFillPurple: { height: 8, backgroundColor: '#8b5cf6', borderRadius: 4 },
  activityHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  emptyText: { fontSize: 13, color: colors.muted, paddingVertical: 8 },
  txnRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  left: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
  leftText: { flex: 1 },
  txnType: { fontSize: 14, fontWeight: '600', color: colors.text, textTransform: 'capitalize' },
  txnDesc: { fontSize: 12, color: colors.muted, marginTop: 1 },
  txnDate: { fontSize: 11, color: colors.muted, marginTop: 1 },
  right: { alignItems: 'flex-end', marginLeft: 8 },
  amount: { fontSize: 15, fontWeight: '600' },
  status: { fontSize: 11, marginTop: 2, fontWeight: '500' },
});
