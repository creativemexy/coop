import { Platform, TurboModuleRegistry } from 'react-native';
import { config } from '../config';
import { areAdsConsented } from '../store/consentStore';

export function isAdsNativeModuleAvailable(): boolean {
  try {
    return TurboModuleRegistry.get('RNGoogleMobileAdsModule') != null;
  } catch {
    return false;
  }
}

export function getBannerAdUnitId(): string {
  return Platform.OS === 'ios' ? config.admob.bannerIosUnit : config.admob.bannerAndroidUnit;
}

export function getInterstitialAdUnitId(): string {
  return Platform.OS === 'ios' ? config.admob.interstitialIosUnit : config.admob.interstitialAndroidUnit;
}

export const adsConfigured =
  Boolean(config.admob.androidAppId) || Boolean(config.admob.iosAppId);

export async function initializeAds(): Promise<void> {
  // Privacy-first: the Google Ads SDK only initialises after explicit consent.
  if (!await areAdsConsented()) return;
  if (!isAdsNativeModuleAvailable()) return;
  try {
    const mod = await import('react-native-google-mobile-ads');
    const mobileAds = mod.default ?? mod.MobileAds;
    await mobileAds().setRequestConfiguration({
      maxAdContentRating: mod.MaxAdContentRating.PG,
      tagForUnderAgeOfConsent: false,
      tagForChildDirectedTreatment: false,
    });
  } catch {
    // ads are optional; ignore failures
  }
}
