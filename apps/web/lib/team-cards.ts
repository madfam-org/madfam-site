/**
 * Contact cards for MADFAM teammates, served at /{locale}/c/{slug} and
 * reached from the printed/shown QR `madf.am/{slug}` (marca). The marca code
 * points at the page, never at a third-party profile, so what a card says can
 * change here without reprinting. The matching vCard lives at
 * public/c/{slug}.vcf — keep the two in step.
 *
 * Work contact only: this repo is public, so no personal phone numbers.
 */
import { cardAttribution, kalyaBookingUrl } from './kalya-embed';

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
    title: 'Lead Industrial and Product Designer',
    linkedin: 'https://www.linkedin.com/in/carohernandezmora/',
    shortLink: 'madf.am/caro',
  },
];

/** The short slug printed in the QR (`madf.am/caro` → `caro`). */
export function shortSlug(card: TeamCard): string {
  return card.shortLink.split('/').pop() ?? card.slug;
}

/** The QR for `card.shortLink`: public/c/{shortSlug}-qr.svg, rendered with
 *  marca's @madfam/qr (square modules, ECC Q) so it matches what marca mints.
 *  Regenerate it if a shortLink changes; the team-cards test checks it exists. */
export function qrSrc(card: TeamCard): string {
  return `/c/${shortSlug(card)}-qr.svg`;
}

/** Home-screen name for the presenter app: "Caro", "Aldo". */
export function appName(card: TeamCard): string {
  const short = shortSlug(card);
  return short.charAt(0).toUpperCase() + short.slice(1);
}

export function findTeamCard(slug: string): TeamCard | undefined {
  return TEAM_CARDS.find(card => card.slug === slug);
}

/** kalya's MADFAM booking page, tagged so a booking says which card sent it.
 *  The card's CTA opens the same flow in-page (components/booking); this is
 *  its href, so no-JS or a failed embed still reaches Kalya. */
export function bookingUrl(slug: string): string {
  return kalyaBookingUrl(cardAttribution(slug));
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
    present: string;
    scanHint: string;
    viewCard: string;
  }
> = {
  es: {
    saveContact: 'Guardar contacto',
    email: 'Escribir correo',
    book: 'Agendar una llamada',
    linkedin: 'Ver LinkedIn',
    site: 'Conocer MADFAM',
    present: 'Presentar mi QR',
    scanHint: 'Escanea para ver mi tarjeta',
    viewCard: 'Ver tarjeta',
    description: 'Tarjeta de contacto en MADFAM',
  },
  en: {
    saveContact: 'Save contact',
    email: 'Send an email',
    book: 'Book a call',
    linkedin: 'View LinkedIn',
    site: 'Discover MADFAM',
    present: 'Present my QR',
    scanHint: 'Scan to see my card',
    viewCard: 'View card',
    description: 'Contact card at MADFAM',
  },
  pt: {
    saveContact: 'Salvar contato',
    email: 'Enviar e-mail',
    book: 'Agendar uma chamada',
    linkedin: 'Ver LinkedIn',
    site: 'Conhecer a MADFAM',
    present: 'Apresentar meu QR',
    scanHint: 'Escaneie para ver meu cartão',
    viewCard: 'Ver cartão',
    description: 'Cartão de contato na MADFAM',
  },
};

export function cardCopy(locale: string) {
  return CARD_COPY[(locale in CARD_COPY ? locale : 'es') as CardLocale];
}
