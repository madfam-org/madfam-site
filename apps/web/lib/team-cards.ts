/**
 * Contact cards for MADFAM teammates, served at /{locale}/c/{slug} and
 * reached from the printed/shown QR `madf.am/{slug}` (marca). The marca code
 * points at the page, never at a third-party profile, so what a card says can
 * change here without reprinting. The matching vCard lives at
 * public/c/{slug}.vcf — keep the two in step.
 *
 * Work contact only: this repo is public, so no personal phone numbers.
 */
export interface TeamCard {
  slug: string;
  name: string;
  email: string;
  title?: string;
  linkedin?: string;
  /** The printed marca link, shown on the card so it can be read aloud. */
  shortLink: string;
}

export const TEAM_CARDS: readonly TeamCard[] = [
  {
    slug: 'aldo',
    name: 'Aldo Ruiz Luna',
    email: 'aldo@madfam.io',
    title: 'Founder and Principal Engineer',
    linkedin: 'https://www.linkedin.com/in/aldoruizluna/',
    shortLink: 'madf.am/aldo',
  },
  {
    slug: 'carolina',
    name: 'Carolina Hernández Mora',
    email: 'caro@madfam.io',
    linkedin: 'https://www.linkedin.com/in/carohernandezmora/',
    shortLink: 'madf.am/caro',
  },
];

export function findTeamCard(slug: string): TeamCard | undefined {
  return TEAM_CARDS.find(card => card.slug === slug);
}

/** kalya's MADFAM booking page, tagged so a booking says which card sent it. */
export function bookingUrl(slug: string): string {
  const params = new URLSearchParams({
    utm_source: 'madf.am',
    utm_medium: 'qr',
    utm_campaign: 'tarjeta',
    utm_content: slug,
  });
  return `https://kalya.app/madfam?${params.toString()}`;
}

type CardLocale = 'es' | 'en' | 'pt';

export const CARD_COPY: Record<
  CardLocale,
  {
    saveContact: string;
    email: string;
    book: string;
    linkedin: string;
    site: string;
    description: string;
  }
> = {
  es: {
    saveContact: 'Guardar contacto',
    email: 'Escribir correo',
    book: 'Agendar una llamada',
    linkedin: 'Ver LinkedIn',
    site: 'Conocer MADFAM',
    description: 'Tarjeta de contacto en MADFAM',
  },
  en: {
    saveContact: 'Save contact',
    email: 'Send an email',
    book: 'Book a call',
    linkedin: 'View LinkedIn',
    site: 'Discover MADFAM',
    description: 'Contact card at MADFAM',
  },
  pt: {
    saveContact: 'Salvar contato',
    email: 'Enviar e-mail',
    book: 'Agendar uma chamada',
    linkedin: 'Ver LinkedIn',
    site: 'Conhecer a MADFAM',
    description: 'Cartão de contato na MADFAM',
  },
};

export function cardCopy(locale: string) {
  return CARD_COPY[(locale in CARD_COPY ? locale : 'es') as CardLocale];
}
