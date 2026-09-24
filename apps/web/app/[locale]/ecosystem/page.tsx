import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { EcosystemPage } from '@/components/EcosystemPage';
import { JsonLd } from '@/components/JsonLd';
import { breadcrumbLd, faqPageLd } from '@/lib/structured-data';
import { seoService } from '@/lib/seo';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const validLocale = (['es', 'en', 'pt'].includes(locale) ? locale : 'es') as 'es' | 'en' | 'pt';

  const content = {
    es: {
      title: 'Ecosistema MADFAM | Una Membresía. Acceso Coordinado.',
      description:
        'Únete al Ecosistema MADFAM — desbloquea capacidades elegibles de la plataforma, soporte coordinado y ventajas del maker node.',
    },
    en: {
      title: 'MADFAM Ecosystem | One Membership. Coordinated Access.',
      description:
        'Join the MADFAM Ecosystem — unlock eligible platform capabilities, coordinated support, and maker-node advantages.',
    },
    pt: {
      title: 'Ecossistema MADFAM | Uma Assinatura. Acesso Coordenado.',
      description:
        'Junte-se ao Ecossistema MADFAM — desbloqueie capacidades elegíveis da plataforma, suporte coordenado e vantagens do maker node.',
    },
  };

  const t = content[validLocale];

  return seoService.generateMetadata({
    title: t.title,
    description: t.description,
    type: 'website',
    locale: validLocale,
    url: '/ecosystem',
    keywords: [
      'MADFAM ecosystem',
      'platform membership',
      'maker node',
      'digital platforms',
      'LATAM',
    ],
  });
}

type FaqItems = Record<string, { question: string; answer: string }>;

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  // JSON-LD (finding C-025): the FAQ this page renders, as FAQPage — read from
  // the same bundle, so the markup can never describe a different FAQ — plus a
  // Home > Ecosystem breadcrumb.
  const t = await getTranslations({ locale, namespace: 'ecosystem' });
  const nav = await getTranslations({ locale, namespace: 'common.nav' });
  const base = process.env.NEXT_PUBLIC_BASE_URL || 'https://madfam.io';
  const faq = Object.values(t.raw('faq.items') as FaqItems);
  const structuredData = [
    faqPageLd(faq),
    breadcrumbLd([
      { name: nav('home'), url: `${base}/${locale}` },
      { name: nav('ecosystem'), url: `${base}/${locale}/ecosystem` },
    ]),
  ];

  return (
    <>
      <JsonLd data={structuredData} />
      <EcosystemPage />
    </>
  );
}
