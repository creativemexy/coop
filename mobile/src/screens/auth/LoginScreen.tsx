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
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { useAuthStore } from '../../store/authStore';

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
            Alert.alert('Google Sign-In Failed', error?.response?.data?.message || error?.message || 'Unable to sign in with Google.');
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
    <TouchableOpacity style={styles.googleButton} onPress={handlePress} disabled={disabled || processing}>
      {processing ? (
        <ActivityIndicator color="#4285F4" />
      ) : (
        <Text style={styles.googleText}>Continue with Google</Text>
      )}
    </TouchableOpacity>
  );
}

export default function LoginScreen({ navigation }: { navigation: any }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const socialLogin = useAuthStore((s) => s.socialLogin);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Login failed. Please try again.';
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
      promptMessage: 'Login to Coop BNPL',
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Coop BNPL</Text>
        <Text style={styles.subtitle}>Sign in to your account</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Sign In</Text>
          )}
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {isGoogleConfigured && (
          <GoogleAuthButton socialLogin={socialLogin as (provider: 'google', idToken: string) => Promise<void>} disabled={loading} />
        )}

        {Platform.OS === 'ios' && (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={12}
            style={styles.appleButton}
            onPress={handleAppleLogin}
          />
        )}

        <TouchableOpacity style={styles.biometricButton} onPress={handleBiometricAuth}>
          <Text style={styles.biometricText}>Sign in with Face ID / Fingerprint</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
          <Text style={styles.link}>Forgot Password?</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.link}>
            Don't have an account? <Text style={styles.linkBold}>Register</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#1a1a2e', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 32 },
  input: { backgroundColor: '#fff', borderRadius: 12, padding: 16, fontSize: 16, marginBottom: 16, borderWidth: 1, borderColor: '#e0e0e0' },
  button: { backgroundColor: '#1a1a2e', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#e0e0e0' },
  dividerText: { color: '#999', fontSize: 13, marginHorizontal: 12 },
  googleButton: { backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#e0e0e0' },
  googleText: { color: '#4285F4', fontSize: 16, fontWeight: '600' },
  appleButton: { width: '100%', height: 52, marginBottom: 12 },
  biometricButton: { backgroundColor: '#e8e8e8', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 12 },
  biometricText: { color: '#1a1a2e', fontSize: 14, fontWeight: '500' },
  link: { textAlign: 'center', marginTop: 16, color: '#666', fontSize: 14 },
  linkBold: { color: '#1a1a2e', fontWeight: '600' },
});