import Constants from 'expo-constants';

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

export const config: AppConfig = {
  apiUrl: extra.apiUrl as string,
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
