import { ArrowLeft as ArrowLeftIcon } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: 'corporate.solutions.colabs',
  });

  return {
    title: `MADFAM Co-Labs - ${t('tagline')} | MADFAM`,
    description: t('description'),
    openGraph: {
      title: `MADFAM Co-Labs - ${t('tagline')}`,
      description: t('description'),
      type: 'website',
    },
  };
}

// Copy deck §5.5 (ruling R14): Co-Labs is a program, not a company. The page
// used to name a third-party partner and list programs marked "Activo"; none
// of that is confirmed (default K3), so it is gone. What remains is what the
// program is and how to start a conversation about it.
export default async function ColabsPage({ params }: Props) {
  const { locale } = await params;

  const t = await getTranslations({ locale, namespace: 'corporate.solutions' });
  const p = await getTranslations({ locale, namespace: 'corporate.solutions.colabs.page' });

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Navigation */}
      <div className="container mx-auto px-4 py-4">
        <Link
          href={`/${locale}/solutions`}
          className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          {t('viewAll')}
        </Link>
      </div>

      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
              <h1 className="text-5xl lg:text-6xl font-bold text-neutral-900">MADFAM Co-Labs</h1>
              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full font-medium">
                {p('badge')}
              </span>
            </div>

            <h2 className="text-2xl text-blue-600 font-medium mb-6">{p('title')}</h2>

            <p className="text-xl text-neutral-600 leading-relaxed mb-8">
              {t('colabs.description')}
            </p>

            <Link
              href={`/${locale}/contact`}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              {p('cta')} →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
