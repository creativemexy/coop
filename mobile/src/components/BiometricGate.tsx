import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';

interface Props {
  onAuthenticated: () => void;
  skipBiometrics: boolean;
}

export default function BiometricGate({ onAuthenticated, skipBiometrics }: Props) {
  const [status, setStatus] = useState<'checking' | 'ready' | 'unavailable' | 'locked'>('checking');
  const [authAttempts, setAuthAttempts] = useState(0);
  const [biometricType, setBiometricType] = useState<string>('');

  useEffect(() => {
    if (skipBiometrics) {
      onAuthenticated();
      return;
    }
    checkBiometrics();
  }, [skipBiometrics]);

  const checkBiometrics = async () => {
    setStatus('checking');
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      if (!compatible) {
        setStatus('unavailable');
        return;
      }

      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!enrolled) {
        setStatus('unavailable');
        return;
      }

      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      const typeNames: string[] = [];
      if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        typeNames.push('fingerprint');
      }
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        typeNames.push('facial recognition');
      }
      if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        typeNames.push('iris');
      }
      setBiometricType(typeNames.join(' or ') || 'biometric');

      setStatus('ready');
      authenticate();
    } catch {
      setStatus('unavailable');
    }
  };

  const authenticate = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock Coop BNPL',
        fallbackLabel: 'Use passcode',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      if (result.success) {
        onAuthenticated();
      } else {
        setAuthAttempts((prev) => prev + 1);
        if (authAttempts >= 2) {
          setStatus('locked');
        }
      }
    } catch {
      setAuthAttempts((prev) => prev + 1);
    }
  };

  if (status === 'checking') {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#1a1a2e" />
        <Text style={styles.text}>Preparing biometrics...</Text>
      </View>
    );
  }

  if (status === 'unavailable') {
    return (
      <View style={styles.container}>
        <Text style={styles.icon}>🔓</Text>
        <Text style={styles.title}>Biometrics Unavailable</Text>
        <Text style={styles.text}>Your device doesn't support biometric authentication or none is enrolled.</Text>
        <Text style={styles.text}>You can still use the app without biometric unlock.</Text>
        <TouchableOpacity style={styles.button} onPress={onAuthenticated}>
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (status === 'locked') {
    return (
      <View style={styles.container}>
        <Text style={styles.icon}>🔒</Text>
        <Text style={styles.title}>Too Many Attempts</Text>
        <Text style={styles.text}>Biometric authentication failed multiple times.</Text>
        <TouchableOpacity style={styles.button} onPress={checkBiometrics}>
          <Text style={styles.buttonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🔐</Text>
      <Text style={styles.title}>App Locked</Text>
      <Text style={styles.text}>Authenticate with {biometricType || 'biometrics'} to continue</Text>
      <TouchableOpacity style={styles.button} onPress={authenticate}>
        <Text style={styles.buttonText}>Unlock</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a2e', padding: 24 },
  icon: { fontSize: 64, marginBottom: 24 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 12 },
  text: { fontSize: 15, color: '#9ca3af', textAlign: 'center', marginBottom: 8, lineHeight: 22 },
  button: { backgroundColor: '#374151', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12, marginTop: 16 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
