import { getTranslations } from 'next-intl/server';
import { Container, Heading, Card, CardContent } from '@/components/ui';
import { LeadForm } from '@/components/LeadForm';

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  await params; // Validate params exist
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
            <p className="text-xl text-obsidian/70">{t('contact.hero.subtitle')}</p>
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
                  <LeadForm source="contact-page" />
                </CardContent>
              </Card>
            </div>

            {/* Contact Info */}
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
                      <a href="mailto:hello@madfam.io" className="text-lavender hover:underline">
                        hello@madfam.io
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-leaf/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-xl">📱</span>
                    </div>
                    <div>
                      <p className="font-medium">{t('common.metadata.whatsapp')}</p>
                      <a
                        href="https://api.whatsapp.com/send?phone=525534106519"
                        className="text-leaf hover:underline"
                      >
                        +52 55 3410 6519
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-sun/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-xl">📍</span>
                    </div>
                    <div>
                      <p className="font-medium">{t('contact.alternativeContact.location')}</p>
                      <p className="text-obsidian/70">{t('contact.alternativeContact.city')}</p>
                      <p className="text-sm text-obsidian/60">
                        {t('contact.alternativeContact.remoteService')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-heading text-xl mb-4">
                  {t('contact.alternativeContact.businessHours')}
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-obsidian/70">
                      {t('contact.alternativeContact.weekdays')}
                    </span>
                    <span className="font-medium">9:00 - 18:00 CST</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-obsidian/70">
                      {t('contact.alternativeContact.saturday')}
                    </span>
                    <span className="font-medium">10:00 - 14:00 CST</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-obsidian/70">
                      {t('contact.alternativeContact.sunday')}
                    </span>
                    <span className="font-medium">{t('contact.alternativeContact.closed')}</span>
                  </div>
                </div>
                <p className="text-sm text-obsidian/60 mt-4">
                  {t('contact.alternativeContact.responseTime')}
                </p>
              </div>

              <div className="bg-gradient-to-br from-lavender/10 to-sun/10 rounded-xl p-6">
                <h3 className="font-heading text-lg mb-2">{t('contact.immediateHelp.title')}</h3>
                <p className="text-sm text-obsidian/70 mb-4">
                  {t('contact.immediateHelp.subtitle')}
                </p>
                <a
                  href="https://calendly.com/madfam/quick-call"
                  className="inline-flex items-center text-lavender font-medium hover:underline"
                >
                  {t('contact.immediateHelp.scheduleCall')}
                </a>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
