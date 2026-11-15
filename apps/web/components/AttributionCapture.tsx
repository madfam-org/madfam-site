'use client';

import { useEffect } from 'react';
import { rememberReferrer, rememberUtm, sessionStore } from '@/lib/attribution';

/**
 * Keeps the landing page's utm_* parameters and the external referrer for the
 * lead form (lib/attribution.ts).
 */
export function AttributionCapture() {
  useEffect(() => {
    const store = sessionStore();
    rememberUtm(window.location.search, store);
    rememberReferrer(document.referrer, window.location.origin, store);
  }, []);
  return null;
}
