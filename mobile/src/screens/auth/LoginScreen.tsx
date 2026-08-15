import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  ImageBackground,
  ScrollView,
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { getErrorMessage } from '../../api/client';
import { useBranding } from '../../hooks/useBranding';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

const isGoogleConfigured = Platform.select({
  ios: Boolean(GOOGLE_IOS_CLIENT_ID),
  android: Boolean(GOOGLE_ANDROID_CLIENT_ID),
  default: Boolean(GOOGLE_WEB_CLIENT_ID),
}) ?? false;

function GoogleAuthButton({ socialLogin, disabled }: { socialLogin: (provider: 'google', idToken: string) => Promise<void>; disabled: boolean }) {
  const [googleRequest, googleResponse, promptGoogleAsync] = Google.useIdTokenAuthRequest({
    clientId: GOOGLE_WEB_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
  });

  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (googleResponse?.type === 'success') {
      const idToken = googleResponse.params?.id_token;
      if (idToken) {
        (async () => {
          setProcessing(true);
          try {
            await socialLogin('google', idToken);
          } catch (error: any) {
            Alert.alert('Google Sign-In Failed', getErrorMessage(error, 'Unable to sign in with Google.'));
          } finally {
            setProcessing(false);
          }
        })();
      } else {
        Alert.alert('Google Sign-In', 'Unable to retrieve credentials.');
      }
    } else if (googleResponse?.type === 'error') {
      Alert.alert('Google Sign-In Failed', 'Unable to sign in with Google.');
    }
  }, [googleResponse]);

  const handlePress = async () => {
    if (!googleRequest) {
      Alert.alert('Google Sign-In', 'Google Sign-In is not configured.');
      return;
    }
    try {
      await promptGoogleAsync();
    } catch (error: any) {
      Alert.alert('Google Sign-In Failed', error?.message || 'Unable to sign in with Google.');
    }
  };

  return (
    <TouchableOpacity style={styles.socialButton} onPress={handlePress} disabled={disabled || processing}>
      {processing ? (
        <ActivityIndicator color="#4285F4" />
      ) : (
        <View style={styles.socialButtonInner}>
          <Ionicons name="logo-google" size={18} color="#4285F4" />
          <Text style={styles.socialText}>Continue with Google</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function LoginScreen({ navigation }: { navigation: any }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const socialLogin = useAuthStore((s) => s.socialLogin);
  const branding = useBranding();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
    } catch (error: any) {
      const message = getErrorMessage(error, 'Login failed. Please try again.');
      Alert.alert('Login Failed', message);
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricAuth = async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    if (!compatible) {
      Alert.alert('Not Available', 'Biometric authentication is not available on this device');
      return;
    }
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (!enrolled) {
      Alert.alert('Not Set Up', 'Please set up biometric authentication in your device settings');
      return;
    }
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: `Login to ${branding?.organizationName || 'Coop BNPL'}`,
      fallbackLabel: 'Use Password',
    });
    if (result.success) {
      // Retrieve stored credentials and auto-login
      const { useAuthStore: store } = await import('../../store/authStore');
      const state = store.getState();
      if (state.user) {
        try {
          await state.login(state.user.email, ''); // re-login with stored session
        } catch {
          Alert.alert('Error', 'Biometric login failed. Please sign in manually.');
        }
      }
    }
  };

  const handleAppleLogin = async () => {
    if (Platform.OS !== 'ios') {
      Alert.alert('Not Available', 'Sign in with Apple is only available on iOS.');
      return;
    }
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (credential?.identityToken) {
        setLoading(true);
        await socialLogin('apple', credential.identityToken, {
          firstName: credential.fullName?.givenName ?? undefined,
          lastName: credential.fullName?.familyName ?? undefined,
        });
      } else {
        Alert.alert('Apple Sign-In', 'Sign in was cancelled.');
      }
    } catch (error: any) {
      if (error?.code === 'ERR_REQUEST_CANCELED') {
        Alert.alert('Apple Sign-In', 'Sign in was cancelled.');
      } else {
        Alert.alert('Apple Sign-In Failed', error?.message || 'Unable to sign in with Apple.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require('../../../assets/login.jpeg')}
      style={styles.background}
      resizeMode="cover"
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.overlay} />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <Image source={require('../../../assets/logo.png')} style={styles.logo} />
            <Text style={styles.heroTitle}>{branding?.organizationName || 'Coop BNPL'}</Text>
            <Text style={styles.heroSubtitle}>
              Empowering communities through savings, credit & growth.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Welcome back</Text>
            <Text style={styles.cardSubtitle}>Sign in to continue to your account</Text>

            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="mail-outline" size={18} color="#9aa3b2" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="you@example.com"
                  placeholderTextColor="#aab2bf"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="lock-closed-outline" size={18} color="#9aa3b2" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor="#aab2bf"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPassword((v) => !v)} hitSlop={8} style={styles.eyeButton}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#9aa3b2" />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.buttonText}>Sign In</Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" />
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} style={styles.forgotWrap}>
              <Text style={styles.forgotText}>Forgot your password?</Text>
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.socialRow}>
              {isGoogleConfigured && (
                <GoogleAuthButton socialLogin={socialLogin as (provider: 'google', idToken: string) => Promise<void>} disabled={loading} />
              )}

              {Platform.OS === 'ios' && (
                <AppleAuthentication.AppleAuthenticationButton
                  buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                  buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                  cornerRadius={14}
                  style={styles.appleButton}
                  onPress={handleAppleLogin}
                />
              )}
            </View>

            <TouchableOpacity style={styles.biometricButton} onPress={handleBiometricAuth}>
              <Ionicons name="finger-print-outline" size={20} color="#173F38" />
              <Text style={styles.biometricText}>Use Face ID / Fingerprint</Text>
            </TouchableOpacity>

            <View style={styles.registerRow}>
              <Text style={styles.registerMuted}>New to {branding?.organizationName || 'Coop BNPL'}? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.registerLink}>Create an account</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.taglineRow}>
              <View style={styles.taglineItem}>
                <Ionicons name="shield-checkmark-outline" size={15} color="#173F38" />
                <Text style={styles.taglineText}>Secure</Text>
              </View>
              <View style={styles.taglineDot} />
              <View style={styles.taglineItem}>
                <Ionicons name="checkmark-done-outline" size={15} color="#173F38" />
                <Text style={styles.taglineText}>Trusted</Text>
              </View>
              <View style={styles.taglineDot} />
              <View style={styles.taglineItem}>
                <Ionicons name="eye-outline" size={15} color="#173F38" />
                <Text style={styles.taglineText}>Transparent</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 16, 30, 0.62)',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    paddingTop: 48,
  },
  hero: { alignItems: 'center', marginBottom: 20, paddingHorizontal: 24 },
  logo: { width: 84, height: 84, borderRadius: 20, marginBottom: 12 },
  heroTitle: { fontSize: 28, fontWeight: '800', color: '#ffffff', textAlign: 'center' },
  heroSubtitle: { fontSize: 14, color: '#e6edf3', textAlign: 'center', marginTop: 6, opacity: 0.85 },
  card: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 26,
    paddingBottom: 22,
  },
  cardTitle: { fontSize: 24, fontWeight: '800', color: '#0f172a' },
  cardSubtitle: { fontSize: 14, color: '#64748b', marginTop: 4, marginBottom: 22 },
  field: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 7 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  input: { flex: 1, paddingVertical: 14, fontSize: 16, color: '#0f172a' },
  inputIcon: { marginRight: 10 },
  eyeButton: { padding: 4 },
  button: {
    backgroundColor: '#173F38',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
    shadowColor: '#173F38',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  forgotWrap: { alignItems: 'center', marginTop: 14 },
  forgotText: { color: '#173F38', fontSize: 14, fontWeight: '600' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#e2e8f0' },
  dividerText: { color: '#94a3b8', fontSize: 12, marginHorizontal: 12 },
  socialRow: { gap: 12 },
  socialButton: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  socialButtonInner: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  socialText: { color: '#0f172a', fontSize: 15, fontWeight: '600' },
  appleButton: { width: '100%', height: 50 },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: '#eef4f2',
    borderWidth: 1.5,
    borderColor: '#d7e4df',
  },
  biometricText: { color: '#173F38', fontSize: 14, fontWeight: '600' },
  registerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 22 },
  registerMuted: { color: '#64748b', fontSize: 14 },
  registerLink: { color: '#173F38', fontSize: 14, fontWeight: '700' },
  taglineRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 18, gap: 8 },
  taglineItem: { flexDirection: 'row', alignItems: 'center' },
  taglineText: { color: '#475569', fontSize: 12, fontWeight: '500', marginLeft: 5 },
  taglineDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#cbd5e1' },
});
