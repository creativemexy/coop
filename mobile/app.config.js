const { EXPO_PUBLIC_API_URL } = process.env;

export default {
  expo: {
    name: 'Coop BNPL',
    slug: 'coop-bnpl',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    scheme: 'coopbnpl',
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'cover',
      backgroundColor: '#ffffff',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.coop.bnpl',
      infoPlist: {
        NSUserTrackingUsageDescription:
          process.env.EXPO_PUBLIC_ADS_TRACKING_DESC ||
          'Your data is used to deliver relevant ads and improve our services.',
      },
    },
    android: {
      adaptiveIcon: { backgroundColor: '#ffffff' },
      package: 'com.coop.bnpl',
    },
    plugins: [
      'expo-secure-store',
      'expo-local-authentication',
      'expo-apple-authentication',
    ],
    extra: {
      eas: {
        projectId: '92cf6c03-7e1e-4dca-bd0c-fd8f38ef40bd',
      },
      apiUrl: EXPO_PUBLIC_API_URL || 'https://api.coop-bnpl.com',
      enableSslPinning: process.env.EXPO_PUBLIC_ENABLE_SSL_PINNING === 'true',
      pinnedCertHashes: process.env.EXPO_PUBLIC_PINNED_CERT_HASHES
        ? process.env.EXPO_PUBLIC_PINNED_CERT_HASHES.split(',')
        : [],
      admob: {
        androidAppId: process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID || 'ca-app-pub-3940256099942544~3347511713',
        iosAppId: process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID || 'ca-app-pub-3940256099942544~1458002511',
        bannerAndroidUnit: process.env.EXPO_PUBLIC_ADMOB_BANNER_ANDROID || 'ca-app-pub-3940256099942544/6300978111',
        bannerIosUnit: process.env.EXPO_PUBLIC_ADMOB_BANNER_IOS || 'ca-app-pub-3940256099942544/2934735716',
        interstitialAndroidUnit: process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ANDROID || 'ca-app-pub-3940256099942544/1033173712',
        interstitialIosUnit: process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_IOS || 'ca-app-pub-3940256099942544/4411468910',
      },
    },
  },
};
