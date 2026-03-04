import { getTranslations } from 'next-intl/server';
import { Container, Heading } from '@/components/ui';
import { TranslationList } from '@/components/TranslationList';

// Force dynamic rendering to bypass SSG issue
export const dynamic = 'force-dynamic';

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  await params; // Validate params exist
  const t = await getTranslations('legal');

  return (
    <main className="min-h-screen">
      <section className="pt-20 pb-16 bg-gradient-to-br from-obsidian/5 to-lavender/5">
        <Container>
          <div className="max-w-4xl mx-auto">
            <Heading level={1} className="mb-6">
              {t('terms.title')}
            </Heading>
            <p className="text-lg text-obsidian/70">
              {t('terms.lastUpdated', { date: t('terms.lastUpdatedDate') })}
            </p>
          </div>
        </Container>
      </section>

      <section className="section">
        <Container>
          <div className="max-w-4xl mx-auto prose prose-lg">
            <h2>{t('terms.acceptance.title')}</h2>
            <p>{t('terms.acceptance.content')}</p>

            <h2>{t('terms.services.title')}</h2>
            <p>{t('terms.services.description')}</p>
            <TranslationList t={t} translationKey="terms.services.items" />

            <h2>{t('terms.websiteUse.title')}</h2>
            <h3>{t('terms.websiteUse.license.title')}</h3>
            <p>{t('terms.websiteUse.license.content')}</p>

            <h3>{t('terms.websiteUse.restrictions.title')}</h3>
            <p>{t('terms.websiteUse.restrictions.description')}</p>
            <TranslationList t={t} translationKey="terms.websiteUse.restrictions.items" />

            <h2>{t('terms.intellectualProperty.title')}</h2>
            <h3>{t('terms.intellectualProperty.ourContent.title')}</h3>
            <p>{t('terms.intellectualProperty.ourContent.content')}</p>

            <h3>{t('terms.intellectualProperty.yourContent.title')}</h3>
            <p>{t('terms.intellectualProperty.yourContent.content')}</p>

            <h2>{t('terms.paymentTerms.title')}</h2>
            <h3>{t('terms.paymentTerms.fees.title')}</h3>
            <p>{t('terms.paymentTerms.fees.content')}</p>
            <h3>{t('terms.paymentTerms.payment.title')}</h3>
            <p>{t('terms.paymentTerms.payment.content')}</p>
            <h3>{t('terms.paymentTerms.lateFees.title')}</h3>
            <p>{t('terms.paymentTerms.lateFees.content')}</p>

            <h2>{t('terms.liability.title')}</h2>
            <h3>{t('terms.liability.disclaimer.title')}</h3>
            <p>{t('terms.liability.disclaimer.content')}</p>
            <h3>{t('terms.liability.limitation.title')}</h3>
            <p>{t('terms.liability.limitation.content')}</p>
            <h3>{t('terms.liability.exclusions.title')}</h3>
            <p>{t('terms.liability.exclusions.content')}</p>

            <h2>{t('terms.indemnification.title')}</h2>
            <h3>{t('terms.indemnification.userIndemnity.title')}</h3>
            <p>{t('terms.indemnification.userIndemnity.content')}</p>
            <h3>{t('terms.indemnification.mutualIndemnity.title')}</h3>
            <p>{t('terms.indemnification.mutualIndemnity.content')}</p>

            <h2>{t('terms.termination.title')}</h2>
            <h3>{t('terms.termination.byUser.title')}</h3>
            <p>{t('terms.termination.byUser.content')}</p>
            <h3>{t('terms.termination.byUs.title')}</h3>
            <p>{t('terms.termination.byUs.content')}</p>
            <h3>{t('terms.termination.effects.title')}</h3>
            <p>{t('terms.termination.effects.content')}</p>

            <h2>{t('terms.governingLaw.title')}</h2>
            <h3>{t('terms.governingLaw.jurisdiction.title')}</h3>
            <p>{t('terms.governingLaw.jurisdiction.content')}</p>
            <h3>{t('terms.governingLaw.venue.title')}</h3>
            <p>{t('terms.governingLaw.venue.content')}</p>

            <h2>{t('terms.disputeResolution.title')}</h2>
            <h3>{t('terms.disputeResolution.negotiation.title')}</h3>
            <p>{t('terms.disputeResolution.negotiation.content')}</p>
            <h3>{t('terms.disputeResolution.arbitration.title')}</h3>
            <p>{t('terms.disputeResolution.arbitration.content')}</p>
            <h3>{t('terms.disputeResolution.exceptions.title')}</h3>
            <p>{t('terms.disputeResolution.exceptions.content')}</p>

            <h2>{t('terms.changes.title')}</h2>
            <h3>{t('terms.changes.modifications.title')}</h3>
            <p>{t('terms.changes.modifications.content')}</p>
            <h3>{t('terms.changes.acceptance.title')}</h3>
            <p>{t('terms.changes.acceptance.content')}</p>

            <h2>{t('terms.privacyReference.title')}</h2>
            <h3>{t('terms.privacyReference.dataProtection.title')}</h3>
            <p>{t('terms.privacyReference.dataProtection.content')}</p>
            <h3>{t('terms.privacyReference.consent.title')}</h3>
            <p>{t('terms.privacyReference.consent.content')}</p>

            <h2>{t('terms.generalProvisions.title')}</h2>
            <h3>{t('terms.generalProvisions.entireAgreement.title')}</h3>
            <p>{t('terms.generalProvisions.entireAgreement.content')}</p>
            <h3>{t('terms.generalProvisions.severability.title')}</h3>
            <p>{t('terms.generalProvisions.severability.content')}</p>
            <h3>{t('terms.generalProvisions.waiver.title')}</h3>
            <p>{t('terms.generalProvisions.waiver.content')}</p>
            <h3>{t('terms.generalProvisions.assignment.title')}</h3>
            <p>{t('terms.generalProvisions.assignment.content')}</p>

            <h2>{t('terms.contact.title')}</h2>
            <p>{t('terms.contact.description')}</p>
            <ul>
              <li>{t('terms.contact.email')}</li>
              <li>{t('terms.contact.phone')}</li>
              <li>{t('terms.contact.address')}</li>
            </ul>

            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">{t('terms.disclaimer')}</p>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
