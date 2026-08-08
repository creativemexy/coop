import { create } from 'zustand';
import client, { setTokens, clearTokens, getStoredTokens, fetchCsrfToken } from '../api/client';
import { ENDPOINTS } from '../constants';
import { User, Role } from '../types';
import { getDeviceSecurityInfo, isDeviceCompromised } from '../utils/deviceAttestation';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  biometricRequired: boolean;
  biometricUnlocked: boolean;
  deviceCompromised: boolean;
  login: (email: string, password: string) => Promise<void>;
  socialLogin: (provider: 'google' | 'apple', idToken: string, profile?: { firstName?: string; lastName?: string }) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    organizationCode?: string;
  }) => Promise<{
    registrationFeeRequired: boolean;
    registrationFeeAmount: number;
    pendingUserId?: string;
  }>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
  setBiometricUnlocked: (v: boolean) => void;
  clearError: () => void;
}

function isAllowedRole(role: string): boolean {
  return role === Role.INDIVIDUAL;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  biometricRequired: true,
  biometricUnlocked: false,
  deviceCompromised: false,

  login: async (email: string, password: string) => {
    const deviceInfo = await getDeviceSecurityInfo();
    if (isDeviceCompromised(deviceInfo)) {
      set({ deviceCompromised: true, isLoading: false });
      throw new Error('This device appears to be compromised and cannot access the app.');
    }

    const { data } = await client.post(ENDPOINTS.auth.login, {
      email,
      password,
    });
    if (!isAllowedRole(data.user?.role)) {
      throw new Error('This app is only for individual users. Please use the web app for admin access.');
    }
    await setTokens(data);
    await fetchCsrfToken();
    set({ user: data.user, isAuthenticated: true, error: null });
  },

  socialLogin: async (provider, idToken, profile) => {
    const deviceInfo = await getDeviceSecurityInfo();
    if (isDeviceCompromised(deviceInfo)) {
      set({ deviceCompromised: true, isLoading: false });
      throw new Error('This device appears to be compromised and cannot access the app.');
    }

    const { data } = await client.post(ENDPOINTS.auth.socialExchange, {
      provider,
      idToken,
      firstName: profile?.firstName,
      lastName: profile?.lastName,
    });
    if (!isAllowedRole(data.user?.role)) {
      throw new Error('This app is only for individual users. Please use the web app for admin access.');
    }
    await setTokens(data);
    await fetchCsrfToken();
    set({ user: data.user, isAuthenticated: true, error: null, biometricRequired: false });
  },

  register: async (registerData) => {
    const deviceInfo = await getDeviceSecurityInfo();
    if (isDeviceCompromised(deviceInfo)) {
      set({ deviceCompromised: true, isLoading: false });
      throw new Error('This device appears to be compromised and cannot access the app.');
    }

    const { data } = await client.post(ENDPOINTS.auth.register, registerData);

    if (data.registrationFeeRequired) {
      return {
        registrationFeeRequired: true,
        registrationFeeAmount: data.registrationFeeAmount ?? 0,
        pendingUserId: data.pendingUserId,
      };
    }

    if (!isAllowedRole(data.user?.role)) {
      throw new Error('This app is only for individual users. Please use the web app for admin access.');
    }
    await setTokens(data);
    await fetchCsrfToken();
    set({ user: data.user, isAuthenticated: true, error: null, biometricRequired: true, biometricUnlocked: false });

    return {
      registrationFeeRequired: false,
      registrationFeeAmount: 0,
    };
  },

  logout: async () => {
    try {
      await client.post(ENDPOINTS.auth.logout);
    } catch {
      // ignore
    }
    await clearTokens();
    set({ user: null, isAuthenticated: false, error: null, biometricUnlocked: false });
  },

  restoreSession: async () => {
    try {
      const deviceInfo = await getDeviceSecurityInfo();
      if (isDeviceCompromised(deviceInfo)) {
        await clearTokens();
        set({
          user: null, isAuthenticated: false, isLoading: false,
          deviceCompromised: true, error: 'This device is not trusted.',
        });
        return;
      }

      const tokens = await getStoredTokens();
      if (!tokens) {
        set({ isLoading: false, biometricRequired: false });
        return;
      }
      const { data } = await client.get(ENDPOINTS.auth.me);
      if (!isAllowedRole(data.role)) {
        await clearTokens();
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: 'This app is only for individual users.',
          biometricRequired: false,
        });
        return;
      }
      await fetchCsrfToken();
      set({ user: data, isAuthenticated: true, isLoading: false });
    } catch {
      await clearTokens();
      set({ isLoading: false, biometricRequired: false });
    }
  },

  setBiometricUnlocked: (v: boolean) => set({ biometricUnlocked: v }),

  clearError: () => set({ error: null }),
}));
