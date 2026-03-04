import { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Container, Heading } from '@/components/ui';
import { ROICalculator } from '@/components/ROICalculator';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return {
    title: t('calculator.meta.title'),
    description: t('calculator.meta.description'),
  };
}

export default async function CalculatorPage({ params }: { params: Promise<{ locale: string }> }) {
  await params; // Validate params exist
  const t = await getTranslations();
  return (
    <main className="py-section">
      <Container>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <Heading level={1} gradient>
              {t('calculator.title')}
            </Heading>
            <p className="text-lg mt-4 text-gray-600 dark:text-gray-400">
              {t('calculator.hero.subtitle')}
            </p>
          </div>

          <div className="mb-8">
            <p className="text-center text-gray-600 dark:text-gray-400">
              {t('calculator.selectionHint')}
            </p>
          </div>

          <div className="space-y-8">
            <ROICalculator />

            <div className="bg-gradient-to-r from-sun/10 to-leaf/10 rounded-2xl p-8 text-center">
              <h3 className="font-heading text-xl mb-4">{t('calculator.cta.title')}</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {t('calculator.cta.subtitle')}
              </p>
              <div className="flex gap-4 justify-center">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-obsidian hover:bg-obsidian/90 transition-colors"
                >
                  {t('calculator.cta.requestConsultation')}
                </Link>
                <Link
                  href="/services"
                  className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 dark:border-gray-700 text-base font-medium rounded-lg text-obsidian dark:text-pearl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  {t('calculator.cta.viewServices')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </main>
  );
}
