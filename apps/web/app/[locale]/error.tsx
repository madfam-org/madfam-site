'use client';

import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { useEffect } from 'react';
import { Container, Heading, Button } from '@/components/ui';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('error');
  const locale = useLocale();

  useEffect(() => {
    // Log the error to an error reporting service
    // TODO: Integrate with Sentry or similar error tracking service
    // if (typeof window !== 'undefined' && window.Sentry) {
    //   window.Sentry.captureException(error);
    // }
    console.error('Application error:', error);
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center">
      <section className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-leaf rounded-full filter blur-3xl animate-float" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-sun rounded-full filter blur-3xl animate-float animation-delay-400" />
        </div>

        <Container className="relative z-10">
          <div className="text-center max-w-2xl mx-auto">
            {/* Error Graphic */}
            <div className="mb-8">
              <div className="text-8xl mb-4">⚠️</div>
              <div className="text-6xl font-heading font-bold">
                <span className="text-leaf">{t('title')}</span>
              </div>
            </div>

            <Heading level={1} className="mb-4">
              {t('heading')}
            </Heading>

            <p className="text-xl text-obsidian/70 mb-8">{t('description')}</p>

            <div className="flex flex-wrap gap-4 justify-center mb-8">
              <Button variant="primary" size="lg" onClick={() => reset()}>
                {t('tryAgain')}
              </Button>
              <Link href={`/${locale}`}>
                <Button variant="outline" size="lg">
                  {t('goHome')}
                </Button>
              </Link>
            </div>

            {/* Error details for development */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-8 p-4 bg-red-50 rounded-lg text-left">
                <p className="text-sm font-mono text-red-600 mb-2">
                  {t('errorLabel')} {error.message}
                </p>
                {error.digest && (
                  <p className="text-xs text-red-500">
                    {t('digestLabel')} {error.digest}
                  </p>
                )}
              </div>
            )}

            {/* Support info */}
            <div className="mt-12 p-6 bg-gray-50 rounded-2xl">
              <p className="text-sm text-obsidian/60 mb-2">{t('needHelp')}</p>
              <p className="text-sm">
                {t('contactSupport')}{' '}
                <a
                  href={`mailto:${t('supportEmail')}`}
                  className="text-lavender hover:text-lavender/80"
                >
                  {t('supportEmail')}
                </a>
              </p>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
