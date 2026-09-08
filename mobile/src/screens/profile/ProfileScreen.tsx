import { useState, useEffect } from 'react';
import { Alert, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as LocalAuthentication from 'expo-local-authentication';
import { useNavigation } from '@react-navigation/native';
import client, { getErrorMessage } from '../../api/client';
import { ENDPOINTS } from '../../constants';
import { useAuthStore } from '../../store/authStore';
import { useConsent } from '../../store/consentStore';
import { colors, layout } from '../../ui/theme';

type IconName = keyof typeof Ionicons.glyphMap;
type MenuLink = { label: string; description: string; screen: string; icon: IconName };

const accountLinks: MenuLink[] = [
  { label: 'Payment methods', description: 'Cards and bank accounts', screen: 'PaymentMethods', icon: 'card-outline' },
  { label: 'Transactions', description: 'Your complete money history', screen: 'Transactions', icon: 'swap-horizontal-outline' },
  { label: 'Notifications', description: 'Messages and reminders', screen: 'Notifications', icon: 'notifications-outline' },
  { label: 'Help & support', description: 'Get help with your account', screen: 'SupportTickets', icon: 'help-circle-outline' },
];

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const biometricRequired = useAuthStore((s) => s.biometricRequired);
  const setBiometricRequired = useAuthStore((s) => s.setBiometricRequired);
  const adsEnabled = useConsent((s) => s.adsEnabled);
  const setAdsEnabled = useConsent((s) => s.setAdsEnabled);
  const loadConsent = useConsent((s) => s.load);
  const navigation = useNavigation<any>();
  const isIOS = Platform.OS === 'ios';

  useEffect(() => {
    void loadConsent();
  }, [loadConsent]);
  const [showPassword, setShowPassword] = useState(false);
  const [showNotifPrefs, setShowNotifPrefs] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) return Alert.alert('Enter both passwords', 'Fill in your current password and a new password.');
    if (newPassword.length < 8) return Alert.alert('Choose a longer password', 'Your new password needs at least 8 characters.');
    setSubmitting(true);
    try {
      await client.patch(ENDPOINTS.users.changePassword, { currentPassword, newPassword });
      setShowPassword(false); setCurrentPassword(''); setNewPassword('');
      Alert.alert('Password updated', 'Your account is now protected with the new password.');
    } catch (error: any) { Alert.alert('Could not update password', getErrorMessage(error, 'Please try again.')); }
    finally { setSubmitting(false); }
  };

  const savePreferences = async () => {
    try {
      await client.patch(ENDPOINTS.users.notificationPreferences, { email: emailNotifs, push: pushNotifs });
      setShowNotifPrefs(false);
      Alert.alert('Preferences saved', 'We will use your updated notification choices.');
    } catch (error: any) { Alert.alert('Could not save preferences', getErrorMessage(error, 'Please try again.')); }
  };

  const toggleBiometricLogin = async () => {
    if (biometricRequired) {
      setBiometricRequired(false);
      Alert.alert('Biometric login disabled', 'You will sign in with your password.');
      return;
    }
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      if (!compatible) {
        Alert.alert('Not available', 'This device does not support biometric authentication.');
        return;
      }
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!enrolled) {
        Alert.alert('Not set up', 'Set up Face ID, fingerprint or PIN in your device settings first.');
        return;
      }
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Enable biometric login for Coop BNPL',
        fallbackLabel: 'Use Device PIN',
      });
      if (!result.success) return;
      setBiometricRequired(true);
      Alert.alert('Biometric login enabled', 'You can unlock the app with your face, voice or fingerprint.');
    } catch { Alert.alert('Error', 'Could not enable biometric login. Please try again.'); }
  };

  const toggleAds = async () => {
    const next = !adsEnabled;
    setAdsEnabled(next);
    Alert.alert(
      next ? 'Personalised ads enabled' : 'Personalised ads disabled',
      next
        ? 'Ads may now appear in the app. You can turn them off here at any time.'
        : 'No ads will be shown and no ad data will be collected.'
    );
  };

  const kycVerified = user?.kycStatus === 'approved';

  const modalShell = (children: React.ReactNode) => (
    <View style={styles.modalOverlay}>
      {isIOS ? (
        <BlurView intensity={60} tint="dark" style={styles.modalGlass}>
          {children}
        </BlurView>
      ) : (
        <View style={styles.modalM3}>{children}</View>
      )}
    </View>
  );

  return (
    <LinearGradient
      colors={isIOS ? ['#0A1F1C', '#123A34', '#173F38'] : ['#0E342C', '#173F38', '#1D4A3F']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.background}
    >
      <View style={[styles.blob, styles.blobGold, { top: -90, right: -70 }]} />
      <View style={[styles.blob, styles.blobTeal, { top: '40%', left: -80 }]} />
      <View style={[styles.blob, styles.blobOrange, { bottom: '6%', right: -60 }]} />

      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={[styles.avatar, isIOS && styles.avatarGlass]}>
            <Text style={styles.avatarText}>{user?.firstName?.[0]?.toUpperCase() || 'U'}{user?.lastName?.[0]?.toUpperCase() || ''}</Text>
          </View>
          <Text style={styles.name}>{user?.firstName} {user?.lastName}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <View style={[styles.identity, isIOS && styles.identityGlass]}>
            <Ionicons name={kycVerified ? 'shield-checkmark-outline' : 'alert-circle-outline'} size={15} color={kycVerified ? '#4ADE80' : '#FACC15'} />
            <Text style={[styles.identityText, isIOS && styles.identityTextGlass]}>
              {kycVerified ? 'Identity verified' : 'Identity verification needed'}
            </Text>
          </View>
        </View>

        <Text style={[styles.groupTitle, isIOS && styles.groupTitleGlass]}>Account</Text>
        <View style={[styles.menu, isIOS && styles.menuGlass]}>
          {accountLinks.map((item) => (
            <MenuItem key={item.screen} {...item} isIOS={isIOS} onPress={() => navigation.navigate(item.screen)} />
          ))}
          <MenuItem label="Security" description="Change your account password" icon="lock-closed-outline" isIOS={isIOS} onPress={() => setShowPassword(true)} />
          <TouchableOpacity accessibilityRole="switch" accessibilityState={{ checked: biometricRequired }} style={[styles.menuItem, isIOS && styles.menuItemGlass]} onPress={toggleBiometricLogin}>
            <View style={styles.menuLead}>
              <View style={[styles.menuIcon, isIOS && styles.menuIconGlass]}>
                <Ionicons name="scan-outline" size={21} color={isIOS ? '#8FD8C0' : colors.brand} />
              </View>
              <View style={styles.menuCopy}>
                <Text style={[styles.menuLabel, isIOS && styles.menuLabelGlass]}>{'Biometric login'}</Text>
                <Text style={[styles.menuDescription, isIOS && styles.menuDescriptionGlass]}>{biometricRequired ? 'Enabled — unlock with Face ID / fingerprint' : 'Disabled'}</Text>
              </View>
            </View>
            <View style={[styles.switchTrack, biometricRequired && styles.switchTrackOn]}><View style={[styles.switchThumb, biometricRequired && styles.switchThumbOn]} /></View>
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole="switch" accessibilityState={{ checked: adsEnabled }} style={[styles.menuItem, isIOS && styles.menuItemGlass]} onPress={toggleAds}>
            <View style={styles.menuLead}>
              <View style={[styles.menuIcon, isIOS && styles.menuIconGlass]}>
                <Ionicons name="megaphone" size={21} color={isIOS ? '#8FD8C0' : colors.brand} />
              </View>
              <View style={styles.menuCopy}>
                <Text style={[styles.menuLabel, isIOS && styles.menuLabelGlass]}>{'Personalised ads'}</Text>
                <Text style={[styles.menuDescription, isIOS && styles.menuDescriptionGlass]}>{adsEnabled ? 'Enabled — ads may appear in the app' : 'Disabled — no ads served'}</Text>
              </View>
            </View>
            <View style={[styles.switchTrack, adsEnabled && styles.switchTrackOn]}><View style={[styles.switchThumb, adsEnabled && styles.switchThumbOn]} /></View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity accessibilityRole="button" style={[styles.settingsButton, isIOS && styles.settingsButtonGlass]} onPress={() => setShowNotifPrefs(true)}>
          <Ionicons name="settings-outline" size={19} color={isIOS ? '#8FD8C0' : colors.brand} />
          <Text style={[styles.settingsText, isIOS && styles.settingsTextGlass]}>Notification settings</Text>
        </TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" style={[styles.logoutButton, isIOS && styles.logoutButtonGlass]} onPress={() => Alert.alert('Log out?', 'You can sign in again at any time.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Log out', style: 'destructive', onPress: logout }])}>
          <Ionicons name="log-out-outline" size={19} color={isIOS ? '#FCA5A5' : colors.danger} />
          <Text style={[styles.logoutText, isIOS && styles.logoutTextGlass]}>Log out</Text>
        </TouchableOpacity>

        <Modal visible={showPassword} transparent animationType="slide" onRequestClose={() => setShowPassword(false)}>
          {modalShell(
            <>
              <Text style={styles.modalTitle}>Change password</Text>
              <Text style={styles.modalBody}>Use a strong password you do not use elsewhere.</Text>
              <TextInput style={styles.input} placeholder="Current password" placeholderTextColor={isIOS ? 'rgba(255,255,255,0.45)' : '#9aa3b2'} value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry />
              <TextInput style={styles.input} placeholder="New password (8+ characters)" placeholderTextColor={isIOS ? 'rgba(255,255,255,0.45)' : '#9aa3b2'} value={newPassword} onChangeText={setNewPassword} secureTextEntry />
              <ModalActions isIOS={isIOS} onCancel={() => setShowPassword(false)} onSubmit={handleChangePassword} submitting={submitting} label="Save password" />
            </>,
          )}
        </Modal>
        <Modal visible={showNotifPrefs} transparent animationType="slide" onRequestClose={() => setShowNotifPrefs(false)}>
          {modalShell(
            <>
              <Text style={styles.modalTitle}>Notification settings</Text>
              <Text style={styles.modalBody}>Choose how you would like to hear from us.</Text>
              <PreferenceRow isIOS={isIOS} label="Email notifications" value={emailNotifs} onPress={() => setEmailNotifs((v) => !v)} />
              <PreferenceRow isIOS={isIOS} label="Push notifications" value={pushNotifs} onPress={() => setPushNotifs((v) => !v)} />
              <ModalActions isIOS={isIOS} onCancel={() => setShowNotifPrefs(false)} onSubmit={savePreferences} label="Save choices" />
            </>,
          )}
        </Modal>
      </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function MenuItem({ label, description, icon, onPress, isIOS }: Omit<MenuLink, 'screen'> & { onPress: () => void; isIOS: boolean }) {
  return (
    <TouchableOpacity accessibilityRole="button" accessibilityLabel={`${label}. ${description}`} style={[styles.menuItem, isIOS && styles.menuItemGlass]} onPress={onPress}>
      <View style={styles.menuLead}>
        <View style={[styles.menuIcon, isIOS && styles.menuIconGlass]}>
          <Ionicons name={icon} size={21} color={isIOS ? '#8FD8C0' : colors.brand} />
        </View>
        <View style={styles.menuCopy}>
          <Text style={[styles.menuLabel, isIOS && styles.menuLabelGlass]}>{label}</Text>
          <Text style={[styles.menuDescription, isIOS && styles.menuDescriptionGlass]}>{description}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={isIOS ? 'rgba(255,255,255,0.5)' : colors.muted} />
    </TouchableOpacity>
  );
}

function PreferenceRow({ label, value, onPress, isIOS }: { label: string; value: boolean; onPress: () => void; isIOS: boolean }) {
  return (
    <TouchableOpacity accessibilityRole="switch" accessibilityState={{ checked: value }} style={[styles.preference, isIOS && styles.preferenceGlass]} onPress={onPress}>
      <Text style={[styles.preferenceText, isIOS && styles.preferenceTextGlass]}>{label}</Text>
      <View style={[styles.switchTrack, value && styles.switchTrackOn]}><View style={[styles.switchThumb, value && styles.switchThumbOn]} /></View>
    </TouchableOpacity>
  );
}

function ModalActions({ onCancel, onSubmit, submitting = false, label, isIOS }: { onCancel: () => void; onSubmit: () => void; submitting?: boolean; label: string; isIOS: boolean }) {
  return (
    <View style={styles.modalActions}>
      <TouchableOpacity style={[styles.cancelButton, isIOS && styles.cancelButtonGlass]} onPress={onCancel}>
        <Text style={[styles.cancelText, isIOS && styles.cancelTextGlass]}>Cancel</Text>
      </TouchableOpacity>
      <TouchableOpacity disabled={submitting} style={[styles.submitButton, isIOS && styles.submitButtonGlass]} onPress={onSubmit}>
        <Text style={[styles.submitText, isIOS && styles.submitTextGlass]}>{submitting ? 'Saving…' : label}</Text>
      </TouchableOpacity>
    </View>
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
  content: { paddingBottom: 40 },
  header: { alignItems: 'center', paddingVertical: 28, paddingHorizontal: 20 },
  avatar: {
    width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)',
    marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  avatarGlass: { backgroundColor: 'rgba(255,255,255,0.2)', borderColor: 'rgba(255,255,255,0.45)' },
  avatarText: { color: '#173F38', fontSize: 28, fontWeight: '800' },
  name: { color: '#ffffff', fontSize: 22, fontWeight: '800' },
  email: { color: 'rgba(255,255,255,0.65)', fontSize: 14, marginTop: 4 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: '#F6F3EB' },
  identityGlass: { backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  identityText: { color: '#173F38', fontSize: 12, fontWeight: '700' },
  identityTextGlass: { color: '#ffffff' },
  groupTitle: { color: '#627084', fontSize: 13, fontWeight: '700', letterSpacing: 0.5, marginHorizontal: layout.pagePadding, marginTop: 20, marginBottom: 8, textTransform: 'uppercase' },
  groupTitleGlass: { color: 'rgba(255,255,255,0.6)' },
  menu: {
    backgroundColor: '#F6F3EB', borderRadius: 18, marginHorizontal: layout.pagePadding, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 14, shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  menuGlass: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  menuItem: { minHeight: 72, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, borderBottomColor: '#E5EDEA', borderBottomWidth: StyleSheet.hairlineWidth },
  menuItemGlass: { borderBottomColor: 'rgba(255,255,255,0.12)' },
  menuLead: { alignItems: 'center', flexDirection: 'row', flex: 1 },
  menuIcon: { alignItems: 'center', backgroundColor: '#EAF4FA', borderRadius: 20, height: 40, justifyContent: 'center', marginRight: 12, width: 40 },
  menuIconGlass: { backgroundColor: 'rgba(255,255,255,0.18)' },
  menuCopy: { flex: 1 },
  menuLabel: { color: colors.text, fontSize: 16, fontWeight: '600' },
  menuLabelGlass: { color: '#ffffff' },
  menuDescription: { color: colors.muted, fontSize: 13, marginTop: 2 },
  menuDescriptionGlass: { color: 'rgba(255,255,255,0.6)' },
  settingsButton: {
    alignItems: 'center', backgroundColor: '#EAF4FA', borderColor: '#B6D2E5', borderRadius: 14, borderWidth: 1,
    flexDirection: 'row', gap: 8, justifyContent: 'center', marginHorizontal: layout.pagePadding, marginTop: 18, minHeight: layout.touchTarget,
  },
  settingsButtonGlass: { backgroundColor: 'rgba(255,255,255,0.13)', borderColor: 'rgba(255,255,255,0.3)' },
  settingsText: { color: colors.brand, fontSize: 14, fontWeight: '700' },
  settingsTextGlass: { color: '#8FD8C0' },
  logoutButton: {
    alignItems: 'center', backgroundColor: '#FFF1F2', borderColor: '#F5C2C7', borderRadius: 14, borderWidth: 1,
    flexDirection: 'row', gap: 8, justifyContent: 'center', marginHorizontal: layout.pagePadding, marginTop: 12, minHeight: layout.touchTarget,
  },
  logoutButtonGlass: { backgroundColor: 'rgba(248,113,113,0.14)', borderColor: 'rgba(248,113,113,0.35)' },
  logoutText: { color: colors.danger, fontSize: 15, fontWeight: '700' },
  logoutTextGlass: { color: '#FCA5A5' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(2, 20, 35, 0.55)' },
  modalGlass: {
    borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden',
  },
  modalM3: {
    backgroundColor: '#F6F3EB', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24,
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 20, shadowOffset: { width: 0, height: -6 },
    elevation: 12,
  },
  modalTitle: { color: '#173F38', fontSize: 21, fontWeight: '800' },
  modalBody: { color: '#627084', fontSize: 14, lineHeight: 20, marginTop: 6, marginBottom: 20 },
  input: {
    backgroundColor: '#ffffff', borderColor: '#E2E8F0', borderRadius: 14, borderWidth: 1.5, color: '#173F38',
    fontSize: 16, marginBottom: 12, minHeight: layout.touchTarget, paddingHorizontal: 14,
  },
  preference: { alignItems: 'center', backgroundColor: '#E5EDEA', borderRadius: 14, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, minHeight: 56, paddingHorizontal: 14 },
  preferenceGlass: { backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  preferenceText: { color: '#173F38', fontSize: 16, fontWeight: '600' },
  preferenceTextGlass: { color: '#ffffff' },
  switchTrack: { backgroundColor: '#CBD5E1', borderRadius: 16, height: 30, justifyContent: 'center', padding: 3, width: 52 },
  switchTrackOn: { backgroundColor: '#0F766E' },
  switchThumb: { backgroundColor: '#fff', borderRadius: 12, height: 24, width: 24 },
  switchThumbOn: { alignSelf: 'flex-end' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 18 },
  cancelButton: { alignItems: 'center', backgroundColor: '#E5EDEA', borderRadius: 14, flex: 1, justifyContent: 'center', minHeight: layout.touchTarget },
  cancelButtonGlass: { backgroundColor: 'rgba(255,255,255,0.16)' },
  cancelText: { color: colors.text, fontWeight: '700' },
  cancelTextGlass: { color: '#ffffff' },
  submitButton: { alignItems: 'center', backgroundColor: '#173F38', borderRadius: 14, flex: 1.4, justifyContent: 'center', minHeight: layout.touchTarget },
  submitButtonGlass: { backgroundColor: 'rgba(255,255,255,0.9)' },
  submitText: { color: '#ffffff', fontWeight: '700' },
  submitTextGlass: { color: '#173F38' },
});