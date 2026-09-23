import { getTranslations } from 'next-intl/server';
import { Container, Heading } from '@/components/ui';
import { TranslationList } from '@/components/TranslationList';

// Every string on this page comes from the `cookies` namespace (es/en/pt).
// The cookie table lists only what the site actually sets: the next-intl
// locale cookie (session) and Cloudflare's bot-management cookie. Analytics
// (self-hosted Plausible) is cookieless; consent and theme live in
// localStorage. Full text pending counsel/Tezca review (ruling R47).
export default async function CookiesPage({ params }: { params: Promise<{ locale: string }> }) {
  await params; // Validate params exist
  const t = await getTranslations('cookies');

  const necessaryCookies = [
    {
      name: 'NEXT_LOCALE',
      purpose: t('sections.types.localeCookie'),
      duration: t('sections.types.session'),
    },
    {
      name: '__cf_bm',
      purpose: t('sections.types.cloudflareCookie'),
      duration: t('sections.types.thirtyMinutes'),
    },
  ];

  return (
    <main className="min-h-screen py-20">
      <Container>
        <div className="max-w-4xl mx-auto prose prose-gray dark:prose-invert">
          <Heading level={1}>{t('title')}</Heading>
          <p className="text-lg">{t('lastUpdated', { date: t('lastUpdatedDate') })}</p>

          <section className="mt-8">
            <Heading level={2}>{t('sections.whatAreCookies.title')}</Heading>
            <p>{t('sections.whatAreCookies.description')}</p>
          </section>

          <section className="mt-8">
            <Heading level={2}>{t('sections.howWeUse.title')}</Heading>
            <p>{t('sections.howWeUse.description')}</p>
            <ul>
              <li>
                <strong>{t('sections.howWeUse.essential')}:</strong>{' '}
                {t('sections.howWeUse.essentialDescription')}
              </li>
              <li>
                <strong>{t('sections.howWeUse.analytics')}:</strong>{' '}
                {t('sections.howWeUse.analyticsDescription')}
              </li>
              <li>
                <strong>{t('sections.howWeUse.preference')}:</strong>{' '}
                {t('sections.howWeUse.preferenceDescription')}
              </li>
              <li>
                <strong>{t('sections.howWeUse.marketing')}:</strong>{' '}
                {t('sections.howWeUse.marketingDescription')}
              </li>
            </ul>
          </section>

          <section className="mt-8">
            <Heading level={2}>{t('sections.types.title')}</Heading>

            <h3 className="text-xl font-semibold mt-6 mb-3">
              {t('sections.types.necessaryTitle')}
            </h3>
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">{t('sections.types.columns.name')}</th>
                  <th className="text-left py-2">{t('sections.types.columns.purpose')}</th>
                  <th className="text-left py-2">{t('sections.types.columns.duration')}</th>
                </tr>
              </thead>
              <tbody>
                {necessaryCookies.map(cookie => (
                  <tr key={cookie.name} className="border-b">
                    <td className="py-2">{cookie.name}</td>
                    <td className="py-2">{cookie.purpose}</td>
                    <td className="py-2">{cookie.duration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-4">{t('sections.types.localStorage')}</p>
          </section>

          <section className="mt-8">
            <Heading level={2}>{t('sections.thirdParty.title')}</Heading>
            <p>{t('sections.thirdParty.description')}</p>
          </section>

          <section className="mt-8">
            <Heading level={2}>{t('sections.managing.title')}</Heading>
            <p>{t('sections.managing.description')}</p>
            <p>{t('sections.managing.browserIntro')}</p>
            <TranslationList t={t} translationKey="sections.managing.browserItems" />
          </section>

          <section className="mt-8">
            <Heading level={2}>{t('sections.preferences.title')}</Heading>
            <p>{t('sections.preferences.description')}</p>
          </section>

          <section className="mt-8">
            <Heading level={2}>{t('sections.changes.title')}</Heading>
            <p>{t('sections.changes.description')}</p>
          </section>

          <section className="mt-8">
            <Heading level={2}>{t('sections.contact.title')}</Heading>
            <p>{t('sections.contact.description')}</p>
            <ul>
              <li>{t('sections.contact.responsible')}</li>
              <li>{t('sections.contact.address')}</li>
              <li>{t('sections.contact.channel')}</li>
            </ul>
          </section>
        </div>
      </Container>
    </main>
  );
}
