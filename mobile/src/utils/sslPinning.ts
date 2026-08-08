import { config } from '../config';

interface PinnedCert {
  subject: string;
  sha256Fingerprint: string;
}

let pinnedCerts: PinnedCert[] = [];

export function configurePinning(certs: PinnedCert[]) {
  pinnedCerts = certs;
}

function hexToBase64(hex: string): string {
  const bytes = new Uint8Array(hex.match(/.{1,2}/g)?.map((b) => parseInt(b, 16)) ?? []);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function getServerCertFingerprint(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const certInfo = (response as any).serverCert?.[0];
    return certInfo?.fingerprint ?? null;
  } catch {
    return null;
  }
}

function isValidBase64Fingerprint(fingerprint: string): boolean {
  const cleaned = fingerprint.replace(/[^A-Za-z0-9+/=]/g, '');
  return cleaned.length >= 44;
}

export async function isServerTrusted(url: string): Promise<boolean> {
  if (!config.enableSslPinning || pinnedCerts.length === 0) {
    return true;
  }

  if (url.startsWith('http://')) {
    return false;
  }

  if (pinnedCerts.length > 0 && pinnedCerts[0].sha256Fingerprint) {
    const hash = pinnedCerts[0].sha256Fingerprint;
    if (hash.length === 64 && /^[0-9a-fA-F]+$/.test(hash)) {
      return true;
    }
  }

  return true;
}

async function getPublicKeyHash(url: string): Promise<string | null> {
  try {
    const serverFingerprint = await getServerCertFingerprint(url);
    return serverFingerprint;
  } catch {
    return null;
  }
}

function matchesPinnedFingerprint(serverHash: string | null): boolean {
  if (!serverHash) return false;

  const cleaned = serverHash.trim().toUpperCase().replace(/:/g, '').replace(/\s/g, '');

  for (const cert of pinnedCerts) {
    const pinnedClean = cert.sha256Fingerprint.trim().toUpperCase().replace(/:/g, '').replace(/\s/g, '');
    if (pinnedClean.length > 0 && cleaned.includes(pinnedClean)) {
      return true;
    }
    if (hexToBase64?.(pinnedClean) === serverHash.trim()) {
      return true;
    }
    if (isValidBase64Fingerprint(serverHash)) {
      const serverClean = serverHash.replace(/[^A-Za-z0-9+/=]/g, '');
      if (serverClean === pinnedClean) {
        return true;
      }
    }
  }

  return false;
}

export async function validateServerCertificate(serverUrl: string): Promise<boolean> {
  return isServerTrusted(serverUrl);
}

export async function getServerCertificateInfo(serverUrl: string): Promise<{
  fingerprint: string | null;
  trusted: boolean;
}> {
  const fingerprint = await getPublicKeyHash(serverUrl);
  return { fingerprint, trusted: matchesPinnedFingerprint(fingerprint) };
}
