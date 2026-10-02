import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Container, Heading, Card } from '@/components/ui';
import { routeMetadata } from '@/lib/page-metadata';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return routeMetadata(locale, 'careers', '/careers');
}

// Copy deck §8 (ruling R14). The page used to list four vacancies and a
// benefits package that did not exist (finding M1-002 / L1-021). With no open
// role confirmed (default K1), it renders the deck's empty state. Roles are
// never hard-coded in copy (deck §8.3); when real ones exist they come from a
// data source, not from this file. The CTA goes to the contact form until a
// careers mailbox is provisioned.
const HOW_WE_WORK = ['realProducts', 'ecosystem', 'openByDefault', 'mexico'] as const;

export default async function CareersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations('careers');

  return (
    <main className="min-h-screen py-20">
      <Container>
        <div className="max-w-4xl mx-auto">
          {/* Hero — deck §8.1 */}
          <div className="text-center mb-16">
            <Heading level={1} className="mb-4">
              {t('title')}
            </Heading>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              {t('subtitle')}
            </p>
          </div>

          {/* How we work — deck §8.2 */}
          <div className="mb-16">
            <Heading level={2} className="mb-8 text-center">
              {t('howWeWork.title')}
            </Heading>
            <ul className="grid md:grid-cols-2 gap-6">
              {HOW_WE_WORK.map(key => (
                <li key={key}>
                  <Card className="p-6 h-full">
                    <h3 className="font-bold mb-2">{t(`howWeWork.items.${key}.title`)}</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {t(`howWeWork.items.${key}.description`)}
                    </p>
                  </Card>
                </li>
              ))}
            </ul>
          </div>

          {/* Open roles — deck §8.3, empty state */}
          <div className="text-center">
            <Heading level={2} className="mb-6">
              {t('positions.title')}
            </Heading>
            <Card className="p-8 bg-gradient-to-br from-lavender/10 to-sun/10">
              <p className="text-gray-700 dark:text-gray-300 mb-6">{t('positions.empty')}</p>
              <Link
                href={`/${locale}/contact`}
                className="inline-flex items-center px-6 py-3 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors font-medium"
              >
                {t('positions.cta')}
              </Link>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                {t('positions.microcopy')}
              </p>
            </Card>
          </div>
        </div>
      </Container>
    </main>
  );
}
