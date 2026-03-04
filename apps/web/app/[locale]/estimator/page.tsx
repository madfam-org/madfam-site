import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Container, Heading } from '@/components/ui';
import { ProjectEstimator } from '@/components/ProjectEstimator';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return {
    title: t('estimator.meta.title'),
    description: t('estimator.meta.description'),
  };
}

export default async function EstimatorPage({ params }: { params: Promise<{ locale: string }> }) {
  await params; // Validate params exist
  const t = await getTranslations();
  return (
    <main className="py-section">
      <Container>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <Heading level={1} gradient>
              {t('estimator.title')}
            </Heading>
            <p className="text-lg mt-4 text-gray-600 dark:text-gray-400">
              {t('estimator.hero.subtitle')}
            </p>
          </div>

          <ProjectEstimator />

          <div className="mt-12 bg-gradient-to-r from-obsidian/5 to-lavender/5 dark:from-obsidian/20 dark:to-lavender/20 rounded-2xl p-8">
            <h3 className="font-heading text-xl mb-4">{t('estimator.trust.title')}</h3>
            <div className="grid md:grid-cols-3 gap-6 text-sm">
              <div>
                <h4 className="font-semibold mb-2 text-sun">
                  {t('estimator.trust.experience.title')}
                </h4>
                <p className="text-gray-600 dark:text-gray-400">
                  {t('estimator.trust.experience.description')}
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-leaf">
                  {t('estimator.trust.transparency.title')}
                </h4>
                <p className="text-gray-600 dark:text-gray-400">
                  {t('estimator.trust.transparency.description')}
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-lavender">
                  {t('estimator.trust.methodology.title')}
                </h4>
                <p className="text-gray-600 dark:text-gray-400">
                  {t('estimator.trust.methodology.description')}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('estimator.disclaimer')}</p>
          </div>
        </div>
      </Container>
    </main>
  );
}
