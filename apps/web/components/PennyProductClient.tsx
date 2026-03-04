'use client';

type Locale = 'es' | 'en' | 'pt';
import {
  Container,
  Heading,
  Button,
  Card,
  CardContent,
  Hero,
  LeadForm,
  ROICalculator,
  TestimonialGrid,
  Newsletter,
  type TestimonialData,
  type ROIResults,
  type LeadFormData,
} from '@/components/ui';
import { logServiceInquiry } from '@/lib/logger';

interface PennyFeature {
  icon: string;
  title: string;
  description: string;
  benefits: string[];
}

interface UseCase {
  title: string;
  description: string;
  metrics: {
    reduction: string;
    time: string;
    accuracy: string;
  };
  icon: string;
}

interface PricingPlan {
  name: string;
  price: string;
  currency: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  popular: boolean;
}

interface PennyProductClientProps {
  locale: string;
  translations: {
    heroTitle: string;
    heroSubtitle: string;
    heroDescription: string;
    requestDemo: string;
    viewDocumentation: string;
    activeUsers: string;
    tasksAutomated: string;
    accuracy: string;
    featuresTitle: string;
    featuresSubtitle: string;
    useCasesTitle: string;
    useCasesSubtitle: string;
    testimonialsTitle: string;
    testimonialsSubtitle: string;
    pricingTitle: string;
    pricingSubtitle: string;
    roiTitle: string;
    roiSubtitle: string;
    roiCalculatorTitle: string;
    demoTitle: string;
    demoSubtitle: string;
    demoFormTitle: string;
    demoFormDescription: string;
    scheduleDemo: string;
    newsletterTitle: string;
    newsletterDescription: string;
    subscribe: string;
    mostPopular: string;
    reduction: string;
    toComplete: string;
    accuracyLabel: string;
  };
  features: PennyFeature[];
  useCases: UseCase[];
  testimonials: TestimonialData[];
  pricingPlans: PricingPlan[];
}

export function PennyProductClient({
  locale,
  translations,
  features,
  useCases,
  testimonials,
  pricingPlans,
}: PennyProductClientProps) {
  const currentLocale = locale as Locale;

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <Hero
        variant="product"
        title="Penny"
        subtitle={translations.heroSubtitle}
        description={translations.heroDescription}
        cta={{
          primary: {
            text: translations.requestDemo,
            href: '#demo',
            variant: 'creative',
          },
          secondary: {
            text: translations.viewDocumentation,
            href: '#documentation',
            variant: 'outline',
          },
        }}
        background="gradient"
        className="pt-20"
      >
        <div className="grid grid-cols-3 gap-8 text-center text-white/90">
          <div>
            <div className="text-2xl font-bold text-sun">10k+</div>
            <div className="text-sm">{translations.activeUsers}</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-sun">1M+</div>
            <div className="text-sm">{translations.tasksAutomated}</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-sun">99.8%</div>
            <div className="text-sm">{translations.accuracy}</div>
          </div>
        </div>
      </Hero>

      {/* Features Section */}
      <section className="section">
        <Container>
          <div className="text-center mb-16">
            <Heading level={2} className="mb-4">
              {translations.featuresTitle}
            </Heading>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              {translations.featuresSubtitle}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="p-8">
                <CardContent className="p-0">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="text-4xl">{feature.icon}</div>
                    <div>
                      <h3 className="font-heading text-xl mb-2">{feature.title}</h3>
                      <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {feature.benefits.map((benefit, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-leaf">✓</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* Use Cases Section */}
      <section className="section bg-pearl">
        <Container>
          <div className="text-center mb-16">
            <Heading level={2} className="mb-4">
              {translations.useCasesTitle}
            </Heading>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              {translations.useCasesSubtitle}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {useCases.map((useCase, index) => (
              <Card key={index} className="text-center">
                <CardContent className="p-8">
                  <div className="text-5xl mb-4">{useCase.icon}</div>
                  <h3 className="font-heading text-xl mb-4">{useCase.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">{useCase.description}</p>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-2xl font-bold text-leaf">
                        {useCase.metrics.reduction}
                      </div>
                      <div className="text-gray-500">{translations.reduction}</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-sun">{useCase.metrics.time}</div>
                      <div className="text-gray-500">{translations.toComplete}</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-lavender">
                        {useCase.metrics.accuracy}
                      </div>
                      <div className="text-gray-500">{translations.accuracyLabel}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* Testimonials Section */}
      <section className="section">
        <Container>
          <div className="text-center mb-16">
            <Heading level={2} className="mb-4">
              {translations.testimonialsTitle}
            </Heading>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              {translations.testimonialsSubtitle}
            </p>
          </div>

          <TestimonialGrid testimonials={testimonials} columns={2} />
        </Container>
      </section>

      {/* Pricing Section */}
      <section className="section bg-pearl">
        <Container>
          <div className="text-center mb-16">
            <Heading level={2} className="mb-4">
              {translations.pricingTitle}
            </Heading>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              {translations.pricingSubtitle}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <Card
                key={index}
                className={`relative ${plan.popular ? 'border-lavender ring-2 ring-lavender/20' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-lavender text-white px-4 py-1 rounded-full text-sm font-medium">
                      {translations.mostPopular}
                    </span>
                  </div>
                )}
                <CardContent className="p-8">
                  <h3 className="font-heading text-2xl mb-2">{plan.name}</h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    {plan.currency && (
                      <>
                        <span className="text-lg text-gray-600 dark:text-gray-400 ml-1">
                          {plan.currency}
                        </span>
                        <span className="text-gray-600 dark:text-gray-400">/{plan.period}</span>
                      </>
                    )}
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">{plan.description}</p>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <span className="text-leaf">✓</span>
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant={plan.popular ? 'creative' : 'primary'}
                    className="w-full"
                    onClick={() =>
                      logServiceInquiry('PLATFORM_PILOTS', 'penny-pricing', {
                        plan: plan.name,
                        locale: currentLocale,
                      })
                    }
                  >
                    {plan.cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* ROI Calculator Section */}
      <section className="section">
        <Container>
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <Heading level={2} className="mb-4">
                {translations.roiTitle}
              </Heading>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                {translations.roiSubtitle}
              </p>
            </div>

            <ROICalculator
              serviceTier="PLATFORM_PILOTS"
              title={translations.roiCalculatorTitle}
              onCalculate={(results: ROIResults) => {
                logServiceInquiry('PLATFORM_PILOTS', 'penny-roi-calculator', {
                  results,
                  locale: currentLocale,
                });
              }}
            />
          </div>
        </Container>
      </section>

      {/* Demo Request Section */}
      <section id="demo" className="section bg-pearl">
        <Container>
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <Heading level={2} className="mb-4">
                {translations.demoTitle}
              </Heading>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                {translations.demoSubtitle}
              </p>
            </div>

            <LeadForm
              variant="progressive"
              source="penny-demo-request"
              title={translations.demoFormTitle}
              description={translations.demoFormDescription}
              submitText={translations.scheduleDemo}
              onSubmit={async (data: LeadFormData) => {
                logServiceInquiry('penny_ai', 'penny-demo-form', {
                  ...data,
                  locale: currentLocale,
                });
                // TODO: Implement actual form submission
              }}
            />
          </div>
        </Container>
      </section>

      {/* Newsletter Section */}
      <section className="section">
        <Container>
          <div className="max-w-2xl mx-auto">
            <Newsletter
              title={translations.newsletterTitle}
              description={translations.newsletterDescription}
              buttonText={translations.subscribe}
              onSubscribe={async _email => {
                // TODO: Implement newsletter subscription
                // console.log('Newsletter subscription:', _email);
              }}
            />
          </div>
        </Container>
      </section>
    </main>
  );
}
