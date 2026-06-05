import { Metadata } from 'next';
import { EcosystemPage } from '@/components/EcosystemPage';
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

export default function Page() {
  return <EcosystemPage />;
}
