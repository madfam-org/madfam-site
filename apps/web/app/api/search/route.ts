import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PLATFORMS } from '@/lib/data/platforms';

const searchQuerySchema = z.object({
  q: z.string().trim().min(2).max(200),
  locale: z.enum(['en', 'es', 'pt']).default('es'),
});

interface SearchResult {
  id: string;
  title: string;
  description: string;
  type: 'service' | 'product' | 'page' | 'article';
  url: string;
  score: number;
}

type Locale = 'en' | 'es' | 'pt';

/**
 * Search blurbs for the products that carry one, keyed by registry slug. Only
 * the blurb is hand-kept: the product's name, its existence and its place in
 * the catalog all come from the ecosystem registry via PLATFORMS, so the search
 * index cannot advertise a product the registry does not know, nor one it has
 * retired.
 */
const PRODUCT_BLURBS: Record<string, Record<Locale, string>> = {
  enclii: {
    en: 'Sovereign cloud platform — GitOps-native PaaS built on Kubernetes',
    pt: 'Plataforma de nuvem soberana — PaaS GitOps-nativa construída sobre Kubernetes',
    es: 'Plataforma de nube soberana — PaaS GitOps-nativa construida sobre Kubernetes',
  },
  janua: {
    en: 'Self-hosted identity platform with enterprise SSO, MFA, and Passkeys',
    pt: 'Plataforma de identidade auto-hospedada com SSO empresarial, MFA e Passkeys',
    es: 'Plataforma de identidad auto-hospedada con SSO empresarial, MFA y Passkeys',
  },
  dhanam: {
    en: 'Wealth & finance platform for LATAM founders',
    pt: 'Plataforma de riqueza e finanças para fundadores LATAM',
    es: 'Plataforma de riqueza y finanzas para fundadores LATAM',
  },
  'forge-sight': {
    en: 'Pricing intelligence for digital fabrication',
    pt: 'Inteligência de precificação para fabricação digital',
    es: 'Inteligencia de precios para fabricación digital',
  },
  'cotiza-studio': {
    en: 'Automated quoting and estimation',
    pt: 'Cotação e estimativa automatizadas',
    es: 'Cotización y estimación automatizadas',
  },
  yantra4d: {
    en: 'Parametric design platform',
    pt: 'Plataforma de design paramétrico',
    es: 'Plataforma de diseño paramétrico',
  },
  'pravara-mes': {
    en: 'Manufacturing execution system',
    pt: 'Sistema de execução de manufatura',
    es: 'Sistema de ejecución de manufactura',
  },
  voxa: {
    en: 'Augmentative & alternative communication platform',
    pt: 'Plataforma de comunicação aumentativa e alternativa',
    es: 'Plataforma de comunicación aumentativa y alternativa',
  },
};

/**
 * Static content index — products, pages, and services.
 * Keyed by locale for fast lookup.
 */
function getStaticContent(locale: Locale): Omit<SearchResult, 'score'>[] {
  const l = locale;
  return [
    // Products — rendered from the ecosystem registry; blurbs from PRODUCT_BLURBS.
    ...PLATFORMS.flatMap(p => {
      const blurb = PRODUCT_BLURBS[p.slug];
      if (!blurb) return [];
      return [
        {
          id: p.slug,
          title: p.name,
          description: blurb[l],
          type: 'product' as const,
          url: `/${l}/${l === 'es' ? 'productos' : l === 'pt' ? 'produtos' : 'products'}#${p.slug}`,
        },
      ];
    }),
    // Pages
    {
      id: 'about',
      title: l === 'en' ? 'About MADFAM' : l === 'pt' ? 'Sobre MADFAM' : 'Acerca de MADFAM',
      description:
        l === 'en'
          ? 'Learn about our mission, vision and team'
          : l === 'pt'
            ? 'Conheça nossa missão, visão e equipe'
            : 'Conoce nuestra misión, visión y equipo',
      type: 'page',
      url: `/${l}/${l === 'es' ? 'nosotros' : l === 'pt' ? 'sobre' : 'about'}`,
    },
    {
      id: 'contact',
      title: l === 'en' ? 'Contact' : l === 'pt' ? 'Contato' : 'Contacto',
      description:
        l === 'en'
          ? 'Get in touch with our team'
          : l === 'pt'
            ? 'Entre em contato com nossa equipe'
            : 'Ponte en contacto con nuestro equipo',
      type: 'page',
      url: `/${l}/${l === 'es' ? 'contacto' : l === 'pt' ? 'contato' : 'contact'}`,
    },
  ];
}

function scoreResult(item: Omit<SearchResult, 'score'>, query: string): number {
  const q = query.toLowerCase();
  const title = item.title.toLowerCase();
  const desc = item.description.toLowerCase();

  // Exact title match
  if (title === q) return 100;
  // Title starts with query
  if (title.startsWith(q)) return 90;
  // Title contains query
  if (title.includes(q)) return 70;
  // Description contains query
  if (desc.includes(q)) return 40;

  // Word-level match
  const words = q.split(/\s+/);
  const matchedWords = words.filter(w => title.includes(w) || desc.includes(w));
  if (matchedWords.length > 0) return 20 + (matchedWords.length / words.length) * 30;

  return 0;
}

/**
 * GET /api/search?q=<query>&locale=<locale>
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl;
  const parsed = searchQuerySchema.safeParse({
    q: searchParams.get('q') ?? undefined,
    locale: searchParams.get('locale') ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ results: [] });
  }

  const { q, locale } = parsed.data;

  // Search static content
  const staticContent = getStaticContent(locale);
  const scored: SearchResult[] = staticContent
    .map(item => ({ ...item, score: scoreResult(item, q) }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  return NextResponse.json({
    results: scored,
    query: q,
    locale,
  });
}
