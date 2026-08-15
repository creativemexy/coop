import { ActivityIndicator, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { colors, layout } from '../ui/theme';
import { useAuthStore } from '../store/authStore';
import BiometricGate from '../components/BiometricGate';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import RegisterFeeScreen from '../screens/auth/RegisterFeeScreen';
import TermsScreen from '../screens/auth/TermsScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import HomeScreen from '../screens/home/HomeScreen';
import CatalogScreen from '../screens/catalog/CatalogScreen';
import PlanSelectionScreen from '../screens/catalog/PlanSelectionScreen';
import SubscriptionsScreen from '../screens/subscriptions/SubscriptionsScreen';
import SubscriptionDetailScreen from '../screens/subscriptions/SubscriptionDetailScreen';
import PaymentWebViewScreen from '../screens/payments/PaymentWebViewScreen';
import PaymentHistoryScreen from '../screens/payments/PaymentHistoryScreen';
import KYCVerificationScreen from '../screens/kyc/KYCVerificationScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import SavingsScreen from '../screens/savings/SavingsScreen';
import LoansScreen from '../screens/loans/LoansScreen';
import RepaymentsScreen from '../screens/repayments/RepaymentsScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';

import PaymentMethodsScreen from '../screens/payment-methods/PaymentMethodsScreen';
import TransactionsScreen from '../screens/transactions/TransactionsScreen';
import ActivityLogScreen from '../screens/activity/ActivityLogScreen';
import SupportTicketsScreen from '../screens/support/SupportTicketsScreen';
import InvestmentsScreen from '../screens/investments/InvestmentsScreen';
import PortfolioScreen from '../screens/investments/PortfolioScreen';
import DistributionsScreen from '../screens/investments/DistributionsScreen';
import RedemptionsScreen from '../screens/investments/RedemptionsScreen';

const AuthStack = createNativeStackNavigator();
const HomeStack = createNativeStackNavigator();
const CatalogStack = createNativeStackNavigator();
const SubStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen name="RegistrationFee" component={RegisterFeeScreen} />
      <AuthStack.Screen name="Terms" component={TermsScreen} options={{ headerShown: true, title: 'Terms & Conditions' }} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </AuthStack.Navigator>
  );
}

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={makeStackOptions('Home')}>
      <HomeStack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <HomeStack.Screen name="KYCVerification" component={KYCVerificationScreen} options={{ title: 'KYC Verification' }} />
    </HomeStack.Navigator>
  );
}

function CatalogStackNavigator() {
  return (
    <CatalogStack.Navigator screenOptions={makeStackOptions('CatalogList')}>
      <CatalogStack.Screen name="CatalogList" component={CatalogScreen} options={{ title: 'BNPL Catalog' }} />
      <CatalogStack.Screen name="PlanSelection" component={PlanSelectionScreen} options={{ title: 'Choose Plan' }} />
    </CatalogStack.Navigator>
  );
}

function SubStackNavigator() {
  return (
    <SubStack.Navigator screenOptions={makeStackOptions('SubscriptionsList')}>
      <SubStack.Screen name="SubscriptionsList" component={SubscriptionsScreen} options={{ title: 'My Subscriptions' }} />
      <SubStack.Screen name="SubscriptionDetail" component={SubscriptionDetailScreen} options={{ title: 'Subscription Details' }} />
      <SubStack.Screen name="PaymentWebView" component={PaymentWebViewScreen} options={{ title: 'Payment' }} />
      <SubStack.Screen name="PaymentHistory" component={PaymentHistoryScreen} options={{ title: 'Payment History' }} />
    </SubStack.Navigator>
  );
}

function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={makeStackOptions('ProfileMain')}>
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} options={{ title: 'Profile' }} />
      <ProfileStack.Screen name="Savings" component={SavingsScreen} options={{ title: 'Savings' }} />
      <ProfileStack.Screen name="Loans" component={LoansScreen} options={{ title: 'Loans' }} />
      <ProfileStack.Screen name="Repayments" component={RepaymentsScreen} options={{ title: 'Repayments' }} />
      <ProfileStack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
      <ProfileStack.Screen name="PaymentMethods" component={PaymentMethodsScreen} options={{ title: 'Payment Methods' }} />
      <ProfileStack.Screen name="Transactions" component={TransactionsScreen} options={{ title: 'Transactions' }} />
      <ProfileStack.Screen name="ActivityLog" component={ActivityLogScreen} options={{ title: 'Activity Log' }} />
      <ProfileStack.Screen name="SupportTickets" component={SupportTicketsScreen} options={{ title: 'Support Tickets' }} />
      <ProfileStack.Screen name="Investments" component={InvestmentsScreen} options={{ title: 'Investments' }} />
      <ProfileStack.Screen name="Portfolio" component={PortfolioScreen} options={{ title: 'Portfolio' }} />
      <ProfileStack.Screen name="Distributions" component={DistributionsScreen} options={{ title: 'Distributions' }} />
      <ProfileStack.Screen name="Redemptions" component={RedemptionsScreen} options={{ title: 'Redemptions' }} />
      <ProfileStack.Screen name="PaymentHistory" component={PaymentHistoryScreen} options={{ title: 'Payment History' }} />
      <ProfileStack.Screen name="KYCVerification" component={KYCVerificationScreen} options={{ title: 'KYC Verification' }} />
    </ProfileStack.Navigator>
  );
}

function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '700' },
        headerShadowVisible: false,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600', marginBottom: 2 },
        tabBarStyle: {
          height: 68,
          paddingTop: 7,
          paddingBottom: 7,
          borderTopColor: colors.border,
          backgroundColor: colors.surface,
        },
      }}
    >
      <Tab.Screen name="HomeTab" component={HomeStackNavigator} options={{ title: 'Home', tabBarLabel: 'Home', tabBarAccessibilityLabel: 'Home', tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" color={color} size={size} /> }} />
      <Tab.Screen name="Catalog" component={CatalogStackNavigator} options={{ title: 'Shop', tabBarLabel: 'Shop', tabBarAccessibilityLabel: 'Shop for items', tabBarIcon: ({ color, size }) => <Ionicons name="bag-handle-outline" color={color} size={size} /> }} />
      <Tab.Screen name="Subscriptions" component={SubStackNavigator} options={{ title: 'My plans', tabBarLabel: 'Plans', tabBarAccessibilityLabel: 'My payment plans', tabBarIcon: ({ color, size }) => <Ionicons name="receipt-outline" color={color} size={size} /> }} />
      <Tab.Screen name="Profile" component={ProfileStackNavigator} options={{ title: 'Account', tabBarLabel: 'Account', tabBarAccessibilityLabel: 'Account and more', popToTopOnBlur: true, tabBarIcon: ({ color, size }) => <Ionicons name="person-circle-outline" color={color} size={size} /> }} listeners={({ navigation, route }) => ({ tabPress: () => { navigation.navigate(route.name, { screen: 'ProfileMain' }); } })} />
    </Tab.Navigator>
  );
}

const makeStackOptions = (rootScreen: string) => ({ navigation, route }: any) => ({
  headerStyle: { backgroundColor: colors.surface },
  headerTintColor: colors.brand,
  headerTitleStyle: { fontWeight: '700' as const, color: colors.text },
  headerShadowVisible: false,
  contentStyle: { backgroundColor: colors.background },
  headerBackTitle: 'Back',
  headerBackButtonDisplayMode: 'minimal' as const,
  headerLeft: ({ canGoBack }: { canGoBack?: boolean }) => {
    const showBack = canGoBack || route.name !== rootScreen;
    if (!showBack) return null;
    return (
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Back" onPress={() => (canGoBack ? navigation.goBack() : navigation.navigate('HomeTab'))} style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8 }}>
        <Ionicons name="arrow-back" size={24} color={colors.brand} />
      </TouchableOpacity>
    );
  },
});

function RestrictedScreen() {
  const error = useAuthStore((s) => s.error);
  const deviceCompromised = useAuthStore((s) => s.deviceCompromised);
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#1a1a2e' }}>
      <Text style={{ fontSize: 18, color: '#ff4444', textAlign: 'center', marginBottom: 16, fontWeight: '600' }}>
        {deviceCompromised ? 'Device Not Trusted' : error || 'Access restricted'}
      </Text>
      <Text style={{ fontSize: 14, color: '#9ca3af', textAlign: 'center' }}>
        {deviceCompromised
          ? 'This device appears to be rooted or jailbroken. For security, access is blocked.'
          : 'This mobile app is for individual users only.'}
      </Text>
    </View>
  );
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const biometricRequired = useAuthStore((s) => s.biometricRequired);
  const biometricUnlocked = useAuthStore((s) => s.biometricUnlocked);
  const setBiometricUnlocked = useAuthStore((s) => s.setBiometricUnlocked);

  if (biometricRequired && !biometricUnlocked) {
    return <BiometricGate onAuthenticated={() => setBiometricUnlocked(true)} skipBiometrics={false} />;
  }

  return <>{children}</>;
}

export default function AppNavigator() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const error = useAuthStore((s) => s.error);
  const deviceCompromised = useAuthStore((s) => s.deviceCompromised);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a2e' }}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (deviceCompromised) {
    return <RestrictedScreen />;
  }

  return (
    <NavigationContainer>
      {error && !isAuthenticated ? <RestrictedScreen /> : isAuthenticated ? (
        <AuthGate>
          <AppTabs />
        </AuthGate>
      ) : <AuthNavigator />}
    </NavigationContainer>
  );
}
