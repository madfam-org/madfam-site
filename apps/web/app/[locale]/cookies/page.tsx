import { getTranslations } from 'next-intl/server';
import { Container, Heading } from '@/components/ui';

export default async function CookiesPage({ params }: { params: Promise<{ locale: string }> }) {
  await params; // Validate params exist
  const t = await getTranslations('cookies');

  return (
    <main className="min-h-screen py-20">
      <Container>
        <div className="max-w-4xl mx-auto prose prose-gray dark:prose-invert">
          <Heading level={1}>{t('title')}</Heading>
          <p className="text-lg">{t('lastUpdated')}: March 15, 2024</p>

          <section className="mt-8">
            <Heading level={2}>{t('sections.whatAreCookies.title')}</Heading>
            <p>{t('sections.whatAreCookies.description')}</p>
          </section>

          <section className="mt-8">
            <Heading level={2}>{t('sections.howWeUse.title')}</Heading>
            <p>{t('sections.howWeUse.description')}</p>
            <ul>
              <li>
                <strong>{t('sections.howWeUse.essential')}:</strong> These cookies are necessary for
                the website to function properly. They enable basic functions like page navigation
                and access to secure areas.
              </li>
              <li>
                <strong>{t('sections.howWeUse.analytics')}:</strong> We use these to understand how
                visitors interact with our website, helping us improve our services.
              </li>
              <li>
                <strong>{t('sections.howWeUse.preference')}:</strong> These remember your
                preferences and choices, such as language settings or dark mode preference.
              </li>
              <li>
                <strong>{t('sections.howWeUse.marketing')}:</strong> Used to track visitors across
                websites to display relevant and engaging advertisements.
              </li>
            </ul>
          </section>

          <section className="mt-8">
            <Heading level={2}>Types of Cookies We Use</Heading>

            <h3 className="text-xl font-semibold mt-6 mb-3">Strictly Necessary Cookies</h3>
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Cookie Name</th>
                  <th className="text-left py-2">Purpose</th>
                  <th className="text-left py-2">Duration</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2">janua-session</td>
                  <td className="py-2">Authentication session</td>
                  <td className="py-2">Session</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">__cf_bm</td>
                  <td className="py-2">Bot detection</td>
                  <td className="py-2">30 minutes</td>
                </tr>
              </tbody>
            </table>

            <h3 className="text-xl font-semibold mt-6 mb-3">Analytics Cookies</h3>
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Cookie Name</th>
                  <th className="text-left py-2">Purpose</th>
                  <th className="text-left py-2">Duration</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2">_ga</td>
                  <td className="py-2">Google Analytics tracking</td>
                  <td className="py-2">2 years</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">_plausible</td>
                  <td className="py-2">Privacy-friendly analytics</td>
                  <td className="py-2">1 year</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section className="mt-8">
            <Heading level={2}>Third-Party Cookies</Heading>
            <p>
              Some of our pages may contain content from third-party services (like YouTube videos
              or social media embeds). These third-party services may set their own cookies, which
              we do not control. We recommend reviewing the cookie policies of these third parties.
            </p>
          </section>

          <section className="mt-8">
            <Heading level={2}>{t('sections.managing.title')}</Heading>
            <p>{t('sections.managing.description')}</p>
            <p>Most browsers allow you to:</p>
            <ul>
              <li>See what cookies you have and delete them individually</li>
              <li>Block all cookies</li>
              <li>Block third-party cookies</li>
              <li>Clear all cookies when you close your browser</li>
              <li>Open a &apos;private browsing&apos; or &apos;incognito&apos; session</li>
            </ul>
          </section>

          <section className="mt-8">
            <Heading level={2}>Cookie Settings</Heading>
            <p>
              You can manage your cookie preferences at any time by clicking the &quot;Cookie
              Settings&quot; button in the footer of our website or through the cookie consent
              banner when you first visit our site.
            </p>
          </section>

          <section className="mt-8">
            <Heading level={2}>Changes to This Policy</Heading>
            <p>
              We may update this Cookie Policy from time to time to reflect changes in our practices
              or for other operational, legal, or regulatory reasons. We will notify you of any
              material changes by posting the new policy on this page with an updated revision date.
            </p>
          </section>

          <section className="mt-8">
            <Heading level={2}>{t('sections.contact.title')}</Heading>
            <p>{t('sections.contact.description')}</p>
            <ul>
              <li>{t('sections.contact.email')}: privacy@madfam.io</li>
              <li>{t('sections.contact.phone')}: +1 (555) 123-4567</li>
              <li>
                {t('sections.contact.address')}: Innovaciones MADFAM S.A.S. de C.V., Mexico City,
                Mexico
              </li>
            </ul>
          </section>
        </div>
      </Container>
    </main>
  );
}
