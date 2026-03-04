'use client';

import { useTranslations } from 'next-intl';
import { Button, Container, Heading } from '@/components/ui';
import { AnimatedText } from '@/components/AnimatedText';
import { ScrollProgress } from '@/components/ScrollProgress';

export function HomePage() {
  const t = useTranslations();

  return (
    <main className="min-h-screen">
      <ScrollProgress />
      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center bg-gradient-to-br from-obsidian via-obsidian/95 to-lavender/10 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-72 h-72 bg-sun rounded-full filter blur-3xl animate-float" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-lavender rounded-full filter blur-3xl animate-float animation-delay-400" />
        </div>

        <Container className="relative z-10">
          <div className="max-w-4xl">
            <AnimatedText variant="fadeUp" className="mb-6">
              <Heading level={1} className="text-white">
                {t('home.hero.titlePart1')}
                <span className="gradient-text">{t('home.hero.titlePart2')}</span>
              </Heading>
            </AnimatedText>
            <AnimatedText variant="fadeUp" delay={0.2}>
              <p className="text-xl text-white/90 mb-8 max-w-3xl">{t('home.hero.subtitle')}</p>
            </AnimatedText>
            <div className="flex flex-wrap gap-4 animate-fade-up animation-delay-400">
              <Button variant="secondary" size="lg">
                {t('home.hero.exploreServices')}
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-white text-white hover:bg-white hover:text-obsidian"
              >
                {t('home.hero.viewProducts')}
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* Services Overview Section */}
      <section className="section">
        <Container>
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <Heading level={2} className="mb-4">
                {t('home.services.title')}
              </Heading>
              <p className="text-xl text-obsidian/70 max-w-3xl mx-auto">
                {t('home.services.subtitle')}
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div className="text-center p-6 rounded-xl bg-gradient-to-br from-leaf/5 to-leaf/10">
                <div className="text-4xl mb-4">⚡</div>
                <h3 className="text-xl font-heading font-semibold mb-2">
                  {t('services.level1.title')}
                </h3>
                <p className="text-obsidian/70 mb-4">{t('services.level1.quickDescription')}</p>
                <Button variant="outline" size="sm">
                  {t('common.cta.learnMore')}
                </Button>
              </div>
              <div className="text-center p-6 rounded-xl bg-gradient-to-br from-sun/5 to-sun/10">
                <div className="text-4xl mb-4">🚀</div>
                <h3 className="text-xl font-heading font-semibold mb-2">
                  {t('services.level2.title')}
                </h3>
                <p className="text-obsidian/70 mb-4">{t('services.level2.quickDescription')}</p>
                <Button variant="outline" size="sm">
                  {t('common.cta.learnMore')}
                </Button>
              </div>
              <div className="text-center p-6 rounded-xl bg-gradient-to-br from-lavender/5 to-lavender/10">
                <div className="text-4xl mb-4">🎯</div>
                <h3 className="text-xl font-heading font-semibold mb-2">
                  {t('services.level3.title')}
                </h3>
                <p className="text-obsidian/70 mb-4">{t('services.level3.quickDescription')}</p>
                <Button variant="creative" size="sm">
                  {t('common.cta.learnMore')}
                </Button>
              </div>
            </div>
            <div className="text-center mt-8">
              <Button variant="primary" size="lg">
                {t('home.services.viewAll')}
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* Products Showcase Section */}
      <section className="section bg-pearl">
        <Container>
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <Heading level={2} className="mb-4">
                {t('home.products.title')}
              </Heading>
              <p className="text-xl text-obsidian/70 max-w-3xl mx-auto">
                {t('home.products.subtitle')}
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-2">
              <div className="bg-white rounded-2xl p-8 shadow-lg">
                <div className="text-4xl mb-4">⚡</div>
                <h3 className="text-2xl font-heading font-bold mb-4">{t('products.spark.name')}</h3>
                <p className="text-obsidian/70 mb-6">{t('home.products.spark.description')}</p>
                <Button variant="primary">{t('common.cta.learnMore')}</Button>
              </div>
              <div className="bg-white rounded-2xl p-8 shadow-lg">
                <div className="text-4xl mb-4">🤖</div>
                <h3 className="text-2xl font-heading font-bold mb-4">{t('products.penny.name')}</h3>
                <p className="text-obsidian/70 mb-6">{t('home.products.penny.description')}</p>
                <Button variant="primary">{t('common.cta.learnMore')}</Button>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="section">
        <Container>
          <div className="bg-gradient-to-br from-obsidian to-obsidian/90 rounded-3xl p-12 text-center text-white">
            <Heading level={2} className="text-white mb-4">
              {t('home.cta.title')}
            </Heading>
            <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">{t('home.cta.subtitle')}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="secondary" size="lg">
                {t('home.cta.getStarted')}
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-white text-white hover:bg-white hover:text-obsidian"
              >
                {t('home.cta.learnMore')}
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
