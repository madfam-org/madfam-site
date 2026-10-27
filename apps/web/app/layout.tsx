import { Metadata } from 'next';
import { headers } from 'next/headers';
import { DarkModeScript } from './dark-mode-script';
import { BrandThemeProvider } from '@/components/ui';
import { PLAUSIBLE_HOST } from '@/lib/plausible';
import { LOCALE_HEADER, SEO_DEFAULT_LOCALE, SEO_LOCALES, type SeoLocale } from '@/lib/seo-urls';
import './globals.css';

// No web fonts are loaded. Inter, Poppins and Space Mono were preloaded on
// every page (8 files) while every element rendered in the system stack, because
// nothing applied them. The brand typeface is chosen with the visual direction.

export const metadata: Metadata = {
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
};

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FAFAFA' },
    { media: '(prefers-color-scheme: dark)', color: '#0A0E27' },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const nonce = headersList.get('x-nonce') ?? undefined;
  // <html lang> from the locale next-intl resolved for this request (finding
  // C-021); routes outside [locale] (e.g. the root 404) fall back to es.
  const requestLocale = headersList.get(LOCALE_HEADER);
  const lang: SeoLocale = SEO_LOCALES.includes(requestLocale as SeoLocale)
    ? (requestLocale as SeoLocale)
    : SEO_DEFAULT_LOCALE;
  const plausibleHost = PLAUSIBLE_HOST;

  return (
    <html lang={lang} suppressHydrationWarning>
      <head>
        <DarkModeScript nonce={nonce} />
        {process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN && (
          <script
            defer
            data-domain={process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN}
            src={`${plausibleHost}/js/script.js`}
            nonce={nonce}
          />
        )}
        {process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN && (
          <script
            nonce={nonce}
            dangerouslySetInnerHTML={{
              __html:
                `window.__PLAUSIBLE_DOMAIN__="${process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN}";` +
                `window.__PLAUSIBLE_HOST__="${plausibleHost}";`,
            }}
          />
        )}
      </head>
      <body className="font-body antialiased bg-white dark:bg-obsidian text-obsidian dark:text-pearl transition-colors">
        <BrandThemeProvider defaultBrandMode="solarpunk-legacy" defaultColorMode="light">
          {children}
        </BrandThemeProvider>
      </body>
    </html>
  );
}
