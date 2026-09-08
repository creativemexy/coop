import axios, {
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL, ENDPOINTS } from '../constants';
import { config } from '../config';
import { validateServerCertificate, configurePinning } from '../utils/sslPinning';

const TOKEN_KEY = 'auth_tokens';
const CSRF_KEY = 'csrf_token';
const BIOMETRIC_KEY = 'biometric_login_enabled';

if (config.enableSslPinning && config.pinnedCertHashes.length > 0) {
  configurePinning(
    config.pinnedCertHashes.map((hash) => ({
      subject: 'API Server',
      sha256Fingerprint: hash,
    }))
  );
}

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

let sessionExpiredHandler: (() => void) | null = null;

export function setSessionExpiredHandler(fn: (() => void) | null) {
  sessionExpiredHandler = fn;
}

export function notifySessionExpired() {
  sessionExpiredHandler?.();
}

async function fetchCsrfToken(): Promise<string | null> {
  try {
    const { data } = await axios.get(`${API_BASE_URL}/${ENDPOINTS.auth.refresh.replace(/refresh$/, 'csrf-token')}`, {
      withCredentials: true,
    });
    const token: string | undefined = data?.token;
    if (token) {
      await SecureStore.setItemAsync(CSRF_KEY, token);
    }
    return token ?? null;
  } catch {
    return null;
  }
}

async function getCsrfToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(CSRF_KEY);
  } catch {
    return null;
  }
}

client.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const tokensJson = await SecureStore.getItemAsync(TOKEN_KEY);
  if (tokensJson) {
    const { accessToken } = JSON.parse(tokensJson);
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  if (!SAFE_METHODS.includes(config.method?.toUpperCase() ?? '')) {
    let csrfToken = await getCsrfToken();
    if (!csrfToken) {
      csrfToken = await fetchCsrfToken();
    }
    if (csrfToken) {
      config.headers['x-csrf-token'] = csrfToken;
    }
  }

  if (config.baseURL && !(config.baseURL.startsWith('http://localhost') || config.baseURL.startsWith('http://127.0.0.1'))) {
    const trusted = await validateServerCertificate(config.baseURL);
    if (!trusted) {
      return Promise.reject(new Error('SSL certificate validation failed'));
    }
  }
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
}

client.interceptors.response.use(
  (response) => {
    const csrfToken = response.data?.csrfToken ?? response.headers['x-csrf-token'];
    if (csrfToken) {
      SecureStore.setItemAsync(CSRF_KEY, csrfToken).catch(() => {});
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 403 &&
        ((error.response?.data as any)?.message === 'CSRF token missing' ||
         (error.response?.data as any)?.message === 'Invalid CSRF token') &&
        !(originalRequest as any)?._csrfRetry) {
      (originalRequest as any)._csrfRetry = true;
      const token = await fetchCsrfToken();
      if (token) {
        originalRequest.headers['x-csrf-token'] = token;
        return client(originalRequest);
      }
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(client(originalRequest));
            },
            reject,
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const tokensJson = await SecureStore.getItemAsync(TOKEN_KEY);
        if (!tokensJson) {
          await SecureStore.deleteItemAsync(TOKEN_KEY);
          notifySessionExpired();
          return Promise.reject(error);
        }

        const { refreshToken } = JSON.parse(tokensJson);
        const { data } = await axios.post(
          `${API_BASE_URL}/${ENDPOINTS.auth.refresh}`,
          { refreshToken },
          { withCredentials: true },
        );

        const newTokens = { accessToken: data.accessToken, refreshToken: data.refreshToken ?? refreshToken };
        await SecureStore.setItemAsync(TOKEN_KEY, JSON.stringify(newTokens));

        processQueue(null, data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return client(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        notifySessionExpired();
        throw refreshError;
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export async function setTokens(tokens: {
  accessToken: string;
  refreshToken: string;
}) {
  await SecureStore.setItemAsync(TOKEN_KEY, JSON.stringify(tokens));
}

export async function clearTokens() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(CSRF_KEY);
}

export async function getStoredTokens(): Promise<{
  accessToken: string;
  refreshToken: string;
} | null> {
  const json = await SecureStore.getItemAsync(TOKEN_KEY);
  return json ? JSON.parse(json) : null;
}

export async function refreshAccessToken(): Promise<string | null> {
  try {
    const tokens = await getStoredTokens();
    if (!tokens) return null;
    const { data } = await axios.post(
      `${API_BASE_URL}/${ENDPOINTS.auth.refresh}`,
      { refreshToken: tokens.refreshToken },
      { withCredentials: true },
    );
    const next = {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken ?? tokens.refreshToken,
    };
    await SecureStore.setItemAsync(TOKEN_KEY, JSON.stringify(next));
    return data.accessToken as string;
  } catch {
    return null;
  }
}

export { fetchCsrfToken };

export async function getBiometricPreference(): Promise<boolean> {
  try {
    return (await SecureStore.getItemAsync(BIOMETRIC_KEY)) === 'true';
  } catch {
    return false;
  }
}

export async function setBiometricPreference(enabled: boolean) {
  try {
    if (enabled) {
      await SecureStore.setItemAsync(BIOMETRIC_KEY, 'true');
    } else {
      await SecureStore.deleteItemAsync(BIOMETRIC_KEY);
    }
  } catch { /* ignore */ }
}

/** Safely extract a string error message from an API error response.
 *  NestJS validation errors return `message` as an array of strings, which
 *  cannot be passed to Alert.alert / setState (throws ReadableNativeArray cast
 *  errors in React Native). */
export function getErrorMessage(err: any, fallback = 'Something went wrong'): string {
  const data = err?.response?.data;
  const msg = data?.message ?? err?.message;
  if (Array.isArray(msg)) {
    return msg.filter((m) => typeof m === 'string').join('\n') || fallback;
  }
  if (typeof msg === 'string' && msg.trim()) return msg;
  return fallback;
}

export default client;
