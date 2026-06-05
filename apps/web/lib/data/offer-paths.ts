import { getLocalizedUrl, type Locale } from '@madfam/i18n';

export type OfferPathId = 'platform' | 'build' | 'ecosystem' | 'partner';

export interface OfferPath {
  id: OfferPathId;
  eyebrow: string;
  title: string;
  description: string;
  recommendedFor: string;
  proofPoints: string[];
  primaryCta: string;
  href: string;
  accent: {
    ring: string;
    gradient: string;
    text: string;
    dot: string;
    glow: string;
  };
}

type OfferPathCopy = Omit<OfferPath, 'href' | 'accent'>;

const CONTACT_INTENT: Record<OfferPathId, string> = {
  platform: 'platform',
  build: 'build-with-madfam',
  ecosystem: 'ecosystem-membership',
  partner: 'partner-invest',
};

const ACCENTS: Record<OfferPathId, OfferPath['accent']> = {
  platform: {
    ring: 'border-leaf/30 hover:border-leaf/70',
    gradient: 'from-leaf/20 via-leaf/5 to-transparent',
    text: 'text-leaf',
    dot: 'bg-leaf',
    glow: 'group-hover:shadow-leaf/20',
  },
  build: {
    ring: 'border-sun/40 hover:border-sun/80',
    gradient: 'from-sun/25 via-sun/5 to-transparent',
    text: 'text-sun',
    dot: 'bg-sun',
    glow: 'group-hover:shadow-sun/20',
  },
  ecosystem: {
    ring: 'border-lavender/35 hover:border-lavender/75',
    gradient: 'from-lavender/25 via-lavender/5 to-transparent',
    text: 'text-lavender',
    dot: 'bg-lavender',
    glow: 'group-hover:shadow-lavender/20',
  },
  partner: {
    ring: 'border-cyan-400/35 hover:border-cyan-400/75',
    gradient: 'from-cyan-400/20 via-cyan-400/5 to-transparent',
    text: 'text-cyan-300',
    dot: 'bg-cyan-300',
    glow: 'group-hover:shadow-cyan-400/20',
  },
};

const COPY: Record<Locale, OfferPathCopy[]> = {
  en: [
    {
      id: 'platform',
      eyebrow: 'Use a platform',
      title: 'Start with the product that solves today.',
      description:
        'Find the MADFAM product that fits your workflow, then move into the broader ecosystem when the work expands.',
      recommendedFor: 'Creators, operators, founders, and teams with a specific product need.',
      proofPoints: [
        'Self-serve where ready',
        'External app routes respected',
        'Product-specific access',
      ],
      primaryCta: 'Explore products',
    },
    {
      id: 'build',
      eyebrow: 'Build with MADFAM',
      title: 'Turn an idea, process, or dataset into a launchable system.',
      description:
        'Use MADFAM as a product, AI, data, commerce, and fabrication partner when execution quality matters.',
      recommendedFor:
        'Companies and founders who need strategic delivery, not just software access.',
      proofPoints: ['Product strategy', 'AI and data systems', 'Bits-to-atoms delivery'],
      primaryCta: 'Scope a build',
    },
    {
      id: 'ecosystem',
      eyebrow: 'Join the ecosystem',
      title: 'Coordinate eligible platform access, support, and maker-node advantages.',
      description:
        'Membership is for people and organizations that benefit from MADFAM as an integrated operating environment.',
      recommendedFor:
        'Makers, entrepreneurs, studios, and teams building across multiple MADFAM surfaces.',
      proofPoints: ['Coordinated access', 'Priority support', 'Fabrication advantages'],
      primaryCta: 'Explore membership',
    },
    {
      id: 'partner',
      eyebrow: 'Partner or invest',
      title: 'Connect your institution, capital, or infrastructure to the ecosystem.',
      description:
        'Create distribution, integration, investment, or ecosystem partnerships with a public-safe entry path.',
      recommendedFor:
        'Enterprises, institutions, investors, accelerators, and strategic ecosystem partners.',
      proofPoints: ['Strategic alignment', 'Integration paths', 'Ecosystem leverage'],
      primaryCta: 'Start a partnership conversation',
    },
  ],
  es: [
    {
      id: 'platform',
      eyebrow: 'Usa una plataforma',
      title: 'Empieza con el producto que resuelve lo inmediato.',
      description:
        'Encuentra el producto MADFAM adecuado para tu flujo de trabajo y entra al ecosistema cuando el trabajo crezca.',
      recommendedFor:
        'Creadores, operadores, founders y equipos con una necesidad específica de producto.',
      proofPoints: [
        'Self-serve cuando está listo',
        'Rutas externas respetadas',
        'Acceso específico por producto',
      ],
      primaryCta: 'Explorar productos',
    },
    {
      id: 'build',
      eyebrow: 'Construye con MADFAM',
      title: 'Convierte una idea, proceso o dataset en un sistema lanzable.',
      description:
        'Usa MADFAM como partner de producto, IA, datos, comercio y fabricación cuando la ejecución importa.',
      recommendedFor:
        'Empresas y founders que necesitan entrega estratégica, no solo acceso a software.',
      proofPoints: ['Estrategia de producto', 'Sistemas de IA y datos', 'Entrega bits-to-atoms'],
      primaryCta: 'Definir un build',
    },
    {
      id: 'ecosystem',
      eyebrow: 'Únete al ecosistema',
      title: 'Coordina acceso elegible, soporte y ventajas del maker node.',
      description:
        'La membresía es para personas y organizaciones que aprovechan MADFAM como entorno operativo integrado.',
      recommendedFor:
        'Makers, emprendedores, estudios y equipos que construyen sobre varias superficies MADFAM.',
      proofPoints: ['Acceso coordinado', 'Soporte prioritario', 'Ventajas de fabricación'],
      primaryCta: 'Explorar membresía',
    },
    {
      id: 'partner',
      eyebrow: 'Partner o inversión',
      title: 'Conecta tu institución, capital o infraestructura al ecosistema.',
      description:
        'Crea alianzas de distribución, integración, inversión o ecosistema con una entrada pública segura.',
      recommendedFor:
        'Empresas, instituciones, inversionistas, aceleradoras y partners estratégicos.',
      proofPoints: [
        'Alineación estratégica',
        'Rutas de integración',
        'Apalancamiento del ecosistema',
      ],
      primaryCta: 'Iniciar conversación',
    },
  ],
  pt: [
    {
      id: 'platform',
      eyebrow: 'Use uma plataforma',
      title: 'Comece com o produto que resolve o problema de hoje.',
      description:
        'Encontre o produto MADFAM adequado ao seu fluxo de trabalho e avance para o ecossistema quando o trabalho crescer.',
      recommendedFor:
        'Criadores, operadores, founders e equipes com uma necessidade específica de produto.',
      proofPoints: [
        'Self-serve quando pronto',
        'Rotas externas respeitadas',
        'Acesso específico por produto',
      ],
      primaryCta: 'Explorar produtos',
    },
    {
      id: 'build',
      eyebrow: 'Construa com MADFAM',
      title: 'Transforme uma ideia, processo ou dataset em um sistema lançável.',
      description:
        'Use a MADFAM como parceira de produto, IA, dados, comércio e fabricação quando a execução importa.',
      recommendedFor:
        'Empresas e founders que precisam de entrega estratégica, não só acesso a software.',
      proofPoints: ['Estratégia de produto', 'Sistemas de IA e dados', 'Entrega bits-to-atoms'],
      primaryCta: 'Definir um build',
    },
    {
      id: 'ecosystem',
      eyebrow: 'Entre no ecossistema',
      title: 'Coordene acesso elegível, suporte e vantagens do maker node.',
      description:
        'A assinatura é para pessoas e organizações que usam a MADFAM como ambiente operacional integrado.',
      recommendedFor:
        'Makers, empreendedores, estúdios e equipes construindo em várias superfícies MADFAM.',
      proofPoints: ['Acesso coordenado', 'Suporte prioritário', 'Vantagens de fabricação'],
      primaryCta: 'Explorar assinatura',
    },
    {
      id: 'partner',
      eyebrow: 'Parceria ou investimento',
      title: 'Conecte sua instituição, capital ou infraestrutura ao ecossistema.',
      description:
        'Crie parcerias de distribuição, integração, investimento ou ecossistema com uma entrada pública segura.',
      recommendedFor:
        'Empresas, instituições, investidores, aceleradoras e parceiros estratégicos.',
      proofPoints: ['Alinhamento estratégico', 'Rotas de integração', 'Alavancagem do ecossistema'],
      primaryCta: 'Iniciar conversa',
    },
  ],
};

function contactHref(locale: Locale, id: OfferPathId): string {
  return `${getLocalizedUrl('contact', locale)}?intent=${CONTACT_INTENT[id]}`;
}

function hrefForPath(locale: Locale, id: OfferPathId): string {
  if (id === 'platform') return getLocalizedUrl('products', locale);
  if (id === 'ecosystem') return getLocalizedUrl('ecosystem', locale);
  return contactHref(locale, id);
}

export function getOfferPaths(locale: Locale): OfferPath[] {
  return COPY[locale].map(path => ({
    ...path,
    href: hrefForPath(locale, path.id),
    accent: ACCENTS[path.id],
  }));
}
