'use client';

import { JanuaProvider } from '@janua/nextjs';
import { ReactNode } from 'react';

interface AuthProviderProps {
  children: ReactNode;
}

const januaConfig = {
  baseURL: process.env.NEXT_PUBLIC_JANUA_URL || 'https://auth.madfam.io',
};

export function AuthProvider({ children }: AuthProviderProps) {
  return <JanuaProvider config={januaConfig}>{children}</JanuaProvider>;
}
