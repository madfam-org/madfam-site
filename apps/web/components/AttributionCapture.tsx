'use client';

import { useEffect } from 'react';
import { rememberUtm, sessionStore } from '@/lib/attribution';

/** Keeps the landing page's utm_* parameters for the lead form (lib/attribution.ts). */
export function AttributionCapture() {
  useEffect(() => {
    rememberUtm(window.location.search, sessionStore());
  }, []);
  return null;
}
