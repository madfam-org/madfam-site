'use client';

import { createContext, useContext, ReactNode, useState } from 'react';
// Import brand colors from the single source of truth
// Located at: packages/ui/src/themes/brand-colors.ts
import { brandColors } from '@madfam-site/ui/themes/brand-colors';

type BrandMode = 'solarpunk-legacy' | 'corporate' | 'minimal' | string;
type ColorMode = 'light' | 'dark' | 'system';

interface BrandTheme {
  brandMode: BrandMode;
  colorMode: ColorMode;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    // Brand colors from single source of truth
    brand: {
      green: string;
      purple: string;
      yellow: string;
    };
  };
  setBrandMode: (mode: BrandMode) => void;
  setColorMode: (mode: ColorMode) => void;
}

// Use brand colors from the single source of truth: packages/ui/src/themes/brand-colors.ts
const defaultTheme: BrandTheme = {
  brandMode: 'solarpunk-legacy',
  colorMode: 'light',
  colors: {
    // Semantic colors mapped to brand colors
    primary: brandColors.primary.green, // #2c8136
    secondary: brandColors.primary.purple, // #58326f
    accent: brandColors.primary.yellow, // #eebc15
    // Direct brand color access
    brand: {
      green: brandColors.primary.green,
      purple: brandColors.primary.purple,
      yellow: brandColors.primary.yellow,
    },
  },
  setBrandMode: () => {},
  setColorMode: () => {},
};

const BrandThemeContext = createContext<BrandTheme>(defaultTheme);

interface BrandThemeProviderProps {
  children: ReactNode;
  defaultBrandMode?: BrandMode;
  defaultColorMode?: ColorMode;
  theme?: Partial<BrandTheme>;
}

export function BrandThemeProvider({
  children,
  defaultBrandMode = 'solarpunk-legacy',
  defaultColorMode = 'light',
  theme,
}: BrandThemeProviderProps) {
  const [brandMode, setBrandMode] = useState<BrandMode>(defaultBrandMode);
  const [colorMode, setColorMode] = useState<ColorMode>(defaultColorMode);

  const mergedTheme: BrandTheme = {
    ...defaultTheme,
    ...theme,
    brandMode,
    colorMode,
    colors: {
      ...defaultTheme.colors,
      ...theme?.colors,
      brand: {
        ...defaultTheme.colors.brand,
        ...theme?.colors?.brand,
      },
    },
    setBrandMode,
    setColorMode,
  };

  return <BrandThemeContext.Provider value={mergedTheme}>{children}</BrandThemeContext.Provider>;
}

export function useBrandTheme() {
  return useContext(BrandThemeContext);
}
