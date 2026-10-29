import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { AttributionCapture } from '@/components/AttributionCapture';
import { CookieConsent } from '@/components/CookieConsent';
import { Footer } from '@/components/Footer';
import { GlobalAnalytics } from '@/components/GlobalAnalytics';
import { LoggerProvider } from '@/components/LoggerProvider';
import { Navbar } from '@/components/Navbar';
import { OrganizationStructuredData } from '@/components/StructuredData';
import { locales, getMessages, type Locale } from '@/i18n.config';
import { PATHNAME_HEADER, localizedAlternates, pathWithoutLocale } from '@/lib/seo';
import { MotionPreferences } from '@/components/MotionPreferences';
import { SkipLink } from '@/components/SkipLink';

export function generateStaticParams() {
  return locales.map(locale => ({ locale }));
}

/**
 * Default canonical + hreflang (es/en/pt + x-default) for every page under
 * [locale] (finding C-021). A page that sets its own `alternates` replaces
 * this — e.g. /nauta, whose canonical is nauta.quest (R30).
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const pathname = (await headers()).get(PATHNAME_HEADER) ?? `/${locale}`;
  const parsed = pathWithoutLocale(pathname);
  return { alternates: localizedAlternates(locale, parsed?.path ?? '') };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  // Await params for Next.js 15+ compatibility
  const { locale } = await params;

  // Ensure valid locale
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  // Get messages for the locale
  const messages = getMessages(locale);

  return (
    <LoggerProvider>
      <NextIntlClientProvider messages={messages} locale={locale}>
        <MotionPreferences>
          <OrganizationStructuredData />
          <GlobalAnalytics />
          <AttributionCapture />

          <SkipLink />

          <Navbar />
          <main id="main-content" tabIndex={-1}>
            {children}
          </main>
          <Footer />
          <CookieConsent />
        </MotionPreferences>
      </NextIntlClientProvider>
    </LoggerProvider>
  );
}
