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
      title: 'Ecosistema MADFAM | Una Membresía. Todas las Plataformas.',
      description:
        'Únete al Ecosistema MADFAM — desbloquea acceso Pro en las 9 plataformas más fabricación física con descuento.',
    },
    en: {
      title: 'MADFAM Ecosystem | One Membership. Every Platform.',
      description:
        'Join the MADFAM Ecosystem — unlock Pro access across all 9 platforms plus discounted physical fabrication.',
    },
    pt: {
      title: 'Ecossistema MADFAM | Uma Assinatura. Todas as Plataformas.',
      description:
        'Junte-se ao Ecossistema MADFAM — desbloqueie acesso Pro em todas as 9 plataformas mais fabricação física com desconto.',
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
