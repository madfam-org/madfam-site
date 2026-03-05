import { Metadata } from 'next';
import { MakerNodePage } from '@/components/MakerNodePage';
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
      title: 'Primavera Maker Node | Del Diseño Digital a la Realidad Física | MADFAM',
      description:
        'Impresión 3D, maquinado CNC y corte láser — integrado con el ecosistema MADFAM.',
    },
    en: {
      title: 'Primavera Maker Node | From Digital Design to Physical Reality | MADFAM',
      description:
        '3D printing, CNC machining, and laser cutting — integrated with the MADFAM ecosystem.',
    },
    pt: {
      title: 'Primavera Maker Node | Do Design Digital à Realidade Física | MADFAM',
      description:
        'Impressão 3D, usinagem CNC e corte a laser — integrado com o ecossistema MADFAM.',
    },
  };

  const t = content[validLocale];

  return seoService.generateMetadata({
    title: t.title,
    description: t.description,
    type: 'website',
    locale: validLocale,
    url: '/solutions/maker-node',
    keywords: [
      '3D printing',
      'CNC machining',
      'laser cutting',
      'digital fabrication',
      'MADFAM',
      'maker node',
    ],
  });
}

export default function Page() {
  return <MakerNodePage />;
}
