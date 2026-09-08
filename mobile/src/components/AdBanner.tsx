import { useState, useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { getBannerAdUnitId, isAdsNativeModuleAvailable } from '../utils/ads';
import { useConsent } from '../store/consentStore';

export default function AdBanner() {
  const [banner, setBanner] = useState<{ AdComponent: any; size: string } | null>(null);
  const adsEnabled = useConsent((s) => s.adsEnabled);
  const loadConsent = useConsent((s) => s.load);
  const unitId = getBannerAdUnitId();

  useEffect(() => {
    void loadConsent();
  }, [loadConsent]);

  useEffect(() => {
    let mounted = true;
    // Privacy-first: never load the ad component without explicit consent.
    if (!adsEnabled || !unitId || !isAdsNativeModuleAvailable()) return;

    (async () => {
      try {
        const mod = await import('react-native-google-mobile-ads');
        if (mounted) {
          setBanner({
            AdComponent: mod.BannerAd,
            size: mod.BannerAdSize.ANCHORED_ADAPTIVE_BANNER,
          });
        }
      } catch {
        // native module missing (e.g. Expo Go) — no ads
      }
    })();

    return () => {
      mounted = false;
    };
  }, [adsEnabled, unitId]);

  if (!banner) return null;

  const { AdComponent, size } = banner;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Ad</Text>
      <AdComponent
        unitId={unitId}
        size={size}
        onAdFailedToLoad={() => {
          /* silently ignore ad load failures */
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  label: {
    fontSize: 9,
    color: '#c0c0c0',
    textTransform: 'uppercase',
    marginBottom: 4,
    letterSpacing: 1,
  },
});