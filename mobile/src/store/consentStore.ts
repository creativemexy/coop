import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

/**
 * Privacy consent for the Coop BNPL mobile app.
 *
 * The only optional third-party technology in the app is Google's mobile
 * advertising SDK. Per our Privacy & Cookie Policy, ads are OFF by default and
 * only load once a member opts in from Profile → Account → Personalised ads.
 * Consent is stored in the device secure storage (expo-secure-store).
 */

const CONSENT_KEY = 'ad_consent';
const CONSENT_VERSION = 1;

interface AdConsent {
  adsEnabled: boolean;
  version: number;
  decidedAt: string;
}

interface ConsentState {
  adsEnabled: boolean;
  loaded: boolean;
  load: () => Promise<void>;
  setAdsEnabled: (enabled: boolean) => Promise<void>;
}

export const useConsent = create<ConsentState>((set) => ({
  adsEnabled: false,
  loaded: false,

  load: async () => {
    try {
      const raw = await SecureStore.getItemAsync(CONSENT_KEY);
      if (raw) {
        const parsed: AdConsent = JSON.parse(raw) as AdConsent;
        if (parsed && parsed.version === CONSENT_VERSION) {
          set({ adsEnabled: Boolean(parsed.adsEnabled), loaded: true });
          return;
        }
      }
      // No (or outdated) consent → strictly-necessary only: ads stay off.
      set({ adsEnabled: false, loaded: true });
    } catch {
      set({ adsEnabled: false, loaded: true });
    }
  },

  setAdsEnabled: async (enabled: boolean) => {
    const record: AdConsent = {
      adsEnabled: enabled,
      version: CONSENT_VERSION,
      decidedAt: new Date().toISOString(),
    };
    try {
      await SecureStore.setItemAsync(CONSENT_KEY, JSON.stringify(record));
      set({ adsEnabled: enabled });
    } catch {
      // Secure store unavailable — keep the in-memory value so UI stays consistent.
      set({ adsEnabled: enabled });
    }
  },
}));

/** Read the stored ads consent without initialising the store (used at boot). */
export async function areAdsConsented(): Promise<boolean> {
  try {
    const raw = await SecureStore.getItemAsync(CONSENT_KEY);
    if (!raw) return false;
    const parsed: AdConsent = JSON.parse(raw) as AdConsent;
    return parsed?.version === CONSENT_VERSION && Boolean(parsed.adsEnabled);
  } catch {
    return false;
  }
}