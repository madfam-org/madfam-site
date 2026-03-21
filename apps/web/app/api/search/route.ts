import { NextRequest, NextResponse } from 'next/server';

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
 * Static content index — products, pages, and services.
 * Keyed by locale for fast lookup.
 */
function getStaticContent(locale: Locale): Omit<SearchResult, 'score'>[] {
  const l = locale;
  return [
    // Products
    {
      id: 'enclii',
      title: 'Enclii',
      description:
        l === 'en'
          ? 'Sovereign cloud platform — GitOps-native PaaS built on Kubernetes'
          : l === 'pt'
            ? 'Plataforma de nuvem soberana — PaaS GitOps-nativa construída sobre Kubernetes'
            : 'Plataforma de nube soberana — PaaS GitOps-nativa construida sobre Kubernetes',
      type: 'product',
      url: `/${l}/${l === 'es' ? 'productos' : l === 'pt' ? 'produtos' : 'products'}#enclii`,
    },
    {
      id: 'janua',
      title: 'Janua',
      description:
        l === 'en'
          ? 'Self-hosted identity platform with enterprise SSO, MFA, and Passkeys'
          : l === 'pt'
            ? 'Plataforma de identidade auto-hospedada com SSO empresarial, MFA e Passkeys'
            : 'Plataforma de identidad auto-hospedada con SSO empresarial, MFA y Passkeys',
      type: 'product',
      url: `/${l}/${l === 'es' ? 'productos' : l === 'pt' ? 'produtos' : 'products'}#janua`,
    },
    {
      id: 'dhanam',
      title: 'Dhanam',
      description:
        l === 'en'
          ? 'Wealth & finance platform for LATAM founders'
          : l === 'pt'
            ? 'Plataforma de riqueza e finanças para fundadores LATAM'
            : 'Plataforma de riqueza y finanzas para fundadores LATAM',
      type: 'product',
      url: `/${l}/${l === 'es' ? 'productos' : l === 'pt' ? 'produtos' : 'products'}#dhanam`,
    },
    {
      id: 'forge-sight',
      title: 'Forge Sight',
      description:
        l === 'en'
          ? 'Pricing intelligence for digital fabrication'
          : l === 'pt'
            ? 'Inteligência de precificação para fabricação digital'
            : 'Inteligencia de precios para fabricación digital',
      type: 'product',
      url: `/${l}/${l === 'es' ? 'productos' : l === 'pt' ? 'produtos' : 'products'}#forge-sight`,
    },
    {
      id: 'cotiza-studio',
      title: 'Cotiza Studio',
      description:
        l === 'en'
          ? 'Automated quoting and estimation'
          : l === 'pt'
            ? 'Cotação e estimativa automatizadas'
            : 'Cotización y estimación automatizadas',
      type: 'product',
      url: `/${l}/${l === 'es' ? 'productos' : l === 'pt' ? 'produtos' : 'products'}#cotiza-studio`,
    },
    {
      id: 'yantra4d',
      title: 'Yantra4D',
      description:
        l === 'en'
          ? 'Parametric design platform'
          : l === 'pt'
            ? 'Plataforma de design paramétrico'
            : 'Plataforma de diseño paramétrico',
      type: 'product',
      url: `/${l}/${l === 'es' ? 'productos' : l === 'pt' ? 'produtos' : 'products'}#yantra4d`,
    },
    {
      id: 'pravara-mes',
      title: 'Pravara-MES',
      description:
        l === 'en'
          ? 'Manufacturing execution system'
          : l === 'pt'
            ? 'Sistema de execução de manufatura'
            : 'Sistema de ejecución de manufactura',
      type: 'product',
      url: `/${l}/${l === 'es' ? 'productos' : l === 'pt' ? 'produtos' : 'products'}#pravara-mes`,
    },
    {
      id: 'penny',
      title: 'PENNY',
      description:
        l === 'en'
          ? 'AI-powered process automation assistant'
          : l === 'pt'
            ? 'Assistente de automação de processos com IA'
            : 'Asistente de automatización de procesos con IA',
      type: 'product',
      url: `/${l}/${l === 'es' ? 'productos' : l === 'pt' ? 'produtos' : 'products'}#penny`,
    },
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
    {
      id: 'assessment',
      title: l === 'en' ? 'AI Assessment' : l === 'pt' ? 'Avaliação de IA' : 'Evaluación de IA',
      description:
        l === 'en'
          ? 'Discover the AI potential for your business'
          : l === 'pt'
            ? 'Descubra o potencial de IA para seu negócio'
            : 'Descubre el potencial de IA para tu negocio',
      type: 'page',
      url: `/${l}/${l === 'es' ? 'evaluacion' : l === 'pt' ? 'avaliacao' : 'assessment'}`,
    },
    {
      id: 'calculator',
      title:
        l === 'en' ? 'ROI Calculator' : l === 'pt' ? 'Calculadora de ROI' : 'Calculadora de ROI',
      description:
        l === 'en'
          ? 'Calculate the return on investment of our services'
          : l === 'pt'
            ? 'Calcule o retorno do investimento de nossos serviços'
            : 'Calcula el retorno de inversión de nuestros servicios',
      type: 'page',
      url: `/${l}/${l === 'es' ? 'calculadora' : l === 'pt' ? 'calculadora' : 'calculator'}`,
    },
    {
      id: 'estimator',
      title:
        l === 'en'
          ? 'Project Estimator'
          : l === 'pt'
            ? 'Estimador de Projetos'
            : 'Estimador de Proyectos',
      description:
        l === 'en'
          ? 'Get an instant quote for your project'
          : l === 'pt'
            ? 'Obtenha uma cotação instantânea para seu projeto'
            : 'Obtén una cotización instantánea para tu proyecto',
      type: 'page',
      url: `/${l}/${l === 'es' ? 'estimador' : l === 'pt' ? 'estimador' : 'estimator'}`,
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
  const q = searchParams.get('q')?.trim();
  const locale = (searchParams.get('locale') || 'es') as Locale;

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

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
