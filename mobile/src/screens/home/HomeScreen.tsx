import { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, RefreshControl, TouchableOpacity, StyleSheet,
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { useFocusEffect } from '@react-navigation/native';
import client from '../../api/client';
import { ENDPOINTS } from '../../constants';
import { DashboardData } from '../../types';
import AdBanner from '../../components/AdBanner';

export default function HomeScreen({ navigation }: { navigation: any }) {
  const user = useAuthStore((s) => s.user);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    try {
      const { data: res } = await client.get(ENDPOINTS.dashboard.individual);
      setData(res);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchDashboard(); }, [fetchDashboard]));

  const kycColors: Record<string, string> = {
    approved: '#22c55e', pending: '#eab308', rejected: '#ef4444', none: '#9ca3af',
  };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchDashboard} />}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Welcome, {user?.firstName || 'User'}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      {data?.kycStatus && data.kycStatus !== 'approved' && (
        <TouchableOpacity style={styles.kycBanner} onPress={() => navigation.navigate('KYCVerification')}>
          <Text style={styles.kycBannerText}>
            {data.kycStatus === 'none' ? 'Complete your KYC verification to access all features' :
             data.kycStatus === 'pending' ? 'KYC verification pending review' :
             'KYC verification rejected. Tap to retry'}
          </Text>
        </TouchableOpacity>
      )}

      <View style={styles.cardsRow}>
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Subscriptions')}>
          <Text style={styles.cardValue}>{data?.activeSubscriptions ?? 0}</Text>
          <Text style={styles.cardLabel}>Active Plans</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Repayments')}>
          <Text style={styles.cardValue}>{data?.nextPaymentAmount ? `₦${data.nextPaymentAmount.toLocaleString()}` : '₦0'}</Text>
          <Text style={styles.cardLabel}>Next Payment</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Savings</Text>
        <View style={styles.row}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>₦{(data?.savingsBalance ?? 0).toLocaleString()}</Text>
            <Text style={styles.statLabel}>General</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>₦{(data?.savingsGoalBalance ?? 0).toLocaleString()}</Text>
            <Text style={styles.statLabel}>Goal</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.link} onPress={() => navigation.navigate('Savings')}>
          <Text style={styles.linkText}>View Savings →</Text>
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
            <Text style={styles.statValue}>₦{(data?.totalLoanOutstanding ?? 0).toLocaleString()}</Text>
            <Text style={styles.statLabel}>Outstanding</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.link} onPress={() => navigation.navigate('Loans')}>
          <Text style={styles.linkText}>View Loans →</Text>
        </TouchableOpacity>
      </View>

      {data && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Investments</Text>
          <View style={styles.row}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>₦{(data.totalInvested ?? 0).toLocaleString()}</Text>
              <Text style={styles.statLabel}>Invested</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, (data.unrealizedReturn ?? 0) >= 0 ? styles.green : styles.red]}>
                {(data.unrealizedReturn ?? 0) >= 0 ? '+' : ''}{(data.unrealizedReturn ?? 0).toFixed(1)}%
              </Text>
              <Text style={styles.statLabel}>Return</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.link} onPress={() => navigation.navigate('Investments')}>
            <Text style={styles.linkText}>View Investments →</Text>
          </TouchableOpacity>
        </View>
      )}

      {data?.referralCode && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Referrals</Text>
          <Text style={styles.referralCode}>Code: {data.referralCode}</Text>
          <Text style={styles.statLabel}>{data.referralCount ?? 0} friends · ₦{(data.referralEarnings ?? 0).toLocaleString()} earned</Text>
          <TouchableOpacity style={styles.link} onPress={() => navigation.navigate('Referrals')}>
            <Text style={styles.linkText}>Manage Referrals →</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Savings')}>
          <Text style={styles.actionText}>Deposit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Savings')}>
          <Text style={styles.actionText}>Withdraw</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Loans')}>
          <Text style={styles.actionText}>Apply Loan</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Catalog')}>
          <Text style={styles.actionText}>Shop</Text>
        </TouchableOpacity>
      </View>
      <AdBanner />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#1a1a2e', padding: 24, paddingTop: 16 },
  greeting: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  email: { fontSize: 14, color: '#9ca3af', marginTop: 4 },
  kycBanner: { backgroundColor: '#fef3c7', padding: 12, margin: 16, borderRadius: 8 },
  kycBannerText: { color: '#92400e', fontSize: 13, textAlign: 'center' },
  cardsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 12 },
  card: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 20, elevation: 2 },
  cardValue: { fontSize: 24, fontWeight: 'bold', color: '#1a1a2e' },
  cardLabel: { fontSize: 13, color: '#666', marginTop: 4 },
  section: { backgroundColor: '#fff', margin: 16, marginBottom: 0, borderRadius: 12, padding: 16, elevation: 1 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1a1a2e', marginBottom: 12 },
  row: { flexDirection: 'row', gap: 16 },
  statItem: { flex: 1 },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#1a1a2e' },
  statLabel: { fontSize: 13, color: '#666', marginTop: 2 },
  green: { color: '#22c55e' },
  red: { color: '#ef4444' },
  link: { marginTop: 12 },
  linkText: { color: '#2563eb', fontSize: 14, fontWeight: '500' },
  referralCode: { fontSize: 16, fontWeight: '600', color: '#1a1a2e', marginBottom: 4 },
  quickActions: { flexDirection: 'row', flexWrap: 'wrap', padding: 16, gap: 8 },
  actionBtn: { backgroundColor: '#1a1a2e', borderRadius: 8, paddingHorizontal: 20, paddingVertical: 12 },
  actionText: { color: '#fff', fontSize: 14, fontWeight: '500' },
});
