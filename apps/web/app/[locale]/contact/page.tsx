import { getTranslations } from 'next-intl/server';
import { Container, Heading, Card, CardContent } from '@/components/ui';
import { LeadForm } from '@/components/LeadForm';
import { catalogProductSlug } from '@/lib/contact-link';
import { BookingLauncher } from '@/components/booking/BookingLauncher';
import { siteAttribution } from '@/lib/kalya-embed';

// The discovery call opens MADFAM's Kalya flow in-page; its href is Kalya's own page.
const DISCOVERY_CALL_BOOKING = siteAttribution('contact');

export default async function ContactPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ intent?: string; product?: string }>;
}) {
  await params; // Validate params exist
  const { intent, product } = await searchParams;
  const t = await getTranslations();

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="pt-20 pb-12 bg-gradient-to-br from-obsidian/5 to-lavender/10">
        <Container>
          <div className="max-w-4xl mx-auto text-center">
            <Heading level={1} className="mb-6">
              {t('contact.hero.titlePrefix')}{' '}
              <span className="gradient-text">{t('contact.hero.titleHighlight')}</span>
            </Heading>
            <p className="text-xl text-obsidian/70 dark:text-pearl/70">
              {t('contact.hero.subtitle')}
            </p>
          </div>
        </Container>
      </section>

      {/* Contact Form Section */}
      <section className="section">
        <Container>
          <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Form */}
            <div>
              <Card variant="elevated">
                <CardContent className="p-8">
                  <h2 className="font-heading text-2xl mb-6">{t('contact.form.title')}</h2>
                  <LeadForm
                    source="contact-page"
                    initialIntent={intent}
                    product={catalogProductSlug(product)}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Contact Info. No phone, opening hours or response-time promise:
                no staffed line exists and no SLA is confirmed (ruling R47,
                default K2). The mailbox canon is settled separately. */}
            <div className="space-y-8">
              <div>
                <h3 className="font-heading text-xl mb-4">
                  {t('contact.alternativeContact.title')}
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-lavender/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-xl">📧</span>
                    </div>
                    <div>
                      <p className="font-medium">{t('common.metadata.email')}</p>
                      <a href="mailto:hola@madfam.io" className="text-lavender hover:underline">
                        hola@madfam.io
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-sun/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-xl">📍</span>
                    </div>
                    <div>
                      <p className="font-medium">{t('contact.alternativeContact.location')}</p>
                      <p className="text-obsidian/70 dark:text-pearl/70">
                        {t('contact.alternativeContact.city')}
                      </p>
                      <p className="text-sm text-obsidian/60 dark:text-pearl/60">
                        {t('contact.alternativeContact.remoteService')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-lavender/10 to-sun/10 rounded-xl p-6">
                <h3 className="font-heading text-lg mb-2">{t('contact.immediateHelp.title')}</h3>
                <p className="text-sm text-obsidian/70 mb-4 dark:text-pearl/70">
                  {t('contact.immediateHelp.subtitle')}
                </p>
                <BookingLauncher
                  attribution={DISCOVERY_CALL_BOOKING}
                  target="_blank"
                  className="inline-flex items-center text-lavender font-medium hover:underline"
                >
                  {t('contact.immediateHelp.scheduleCall')}
                </BookingLauncher>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
