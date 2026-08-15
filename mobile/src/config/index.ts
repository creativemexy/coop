import Constants from 'expo-constants';
import { Platform } from 'react-native';

interface AppConfig {
  apiUrl: string;
  enableSslPinning: boolean;
  pinnedCertHashes: string[];
  admob: {
    androidAppId: string;
    iosAppId: string;
    bannerAndroidUnit: string;
    bannerIosUnit: string;
    interstitialAndroidUnit: string;
    interstitialIosUnit: string;
  };
}

const extra = Constants.expoConfig?.extra ?? {};

const BACKEND_PORT = 3001;

/**
 * Resolve the backend API URL without hardcoding a LAN IP.
 *
 * Priority:
 *  1. When running under Expo Go / a dev client, the Metro dev host ships the
 *     Mac's current LAN IP in `Constants.expoConfig.hostUri` (e.g.
 *     "192.168.100.10:8081"). We reuse that host so the URL always follows the
 *     dev machine even when the IP changes between Wi-Fi reconnects.
 *  2. Otherwise fall back to the explicitly configured `EXPO_PUBLIC_API_URL`
 *     (used for production / standalone builds).
 */
function resolveApiUrl(): string {
  const configured = extra.apiUrl as string | undefined;

  const hostUri = Constants.expoConfig?.hostUri;
  const metroHost = hostUri?.split(':')[0];
  const isIpOrLocalhost =
    metroHost === 'localhost' ||
    metroHost === '127.0.0.1' ||
    /^\d{1,3}(\.\d{1,3}){3}$/.test(metroHost || '');
  if (metroHost && isIpOrLocalhost && (__DEV__ || Platform.OS !== 'web')) {
    return `http://${metroHost}:${BACKEND_PORT}`;
  }

  return configured || `http://localhost:${BACKEND_PORT}`;
}

export const config: AppConfig = {
  apiUrl: resolveApiUrl(),
  enableSslPinning: extra.enableSslPinning === true,
  pinnedCertHashes: (extra.pinnedCertHashes as string[]) ?? [],
  admob: extra.admob ?? {
    androidAppId: '',
    iosAppId: '',
    bannerAndroidUnit: '',
    bannerIosUnit: '',
    interstitialAndroidUnit: '',
    interstitialIosUnit: '',
  },
};