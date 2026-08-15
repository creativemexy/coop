import { useEffect, useState } from 'react';
import client from '../api/client';
import { ENDPOINTS } from '../constants';

interface Branding {
  organizationName: string;
  logoUrl: string | null;
  primaryColor: string;
  accentColor: string;
}

let cache: Branding | null = null;

export function useBranding(): Branding | null {
  const [branding, setBranding] = useState<Branding | null>(cache);

  useEffect(() => {
    if (cache) return;
    client
      .get(ENDPOINTS.branding)
      .then((r) => {
        cache = r.data;
        setBranding(r.data);
      })
      .catch(() => {});
  }, []);

  return branding;
}