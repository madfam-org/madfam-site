/**
 * The generated half of a teammate card: the downloadable vCard, the offline
 * vCard payload a poster QR carries, and the square-module QR SVG. Pure
 * functions of lib/team-cards.ts, so the CLI writes them and the team-cards
 * test recomputes them to catch drift.
 *
 * The QR is drawn over the MIT `qrcode` encoder (the same one, same version,
 * that marca's @madfam/qr wraps), one 1×1 rect per dark module with
 * crispEdges: the rounded mint style failed to decode at small sizes
 * (2026-10-28), and square modules stay sharp at every scale.
 */
import { create as createQr } from 'qrcode';
import { type TeamCard, qrSrc, shortSlug } from '../../lib/team-cards';

export const SITE_ORIGIN = 'https://madfam.io';
export const ORG = 'MADFAM';
/** obsidian, the card world's ink. */
export const QR_DARK = '#0A0E27';

/** The card page the marca code redirects to. */
export function cardUrl(card: TeamCard): string {
  return `${SITE_ORIGIN}/es/c/${card.slug}`;
}

/** The tracked link the printed QR carries: every scan counts in marca. */
export function shortUrl(card: TeamCard): string {
  return `https://${card.shortLink}`;
}

/** vCard 3.0 TEXT escaping (RFC 2426 §4): backslash, comma, semicolon, newline. */
function escapeText(value: string): string {
  return value.replace(/[\\,;]/g, m => `\\${m}`).replace(/\r?\n/g, '\\n');
}

function vcard(lines: readonly (string | false | undefined)[]): string {
  return ['BEGIN:VCARD', 'VERSION:3.0', ...lines.filter(Boolean), 'END:VCARD', ''].join('\r\n');
}

/** public/c/{slug}.vcf — what "Guardar contacto" downloads. Work contact
 *  only: there is no phone field to fill, by design. */
export function cardVcf(card: TeamCard): string {
  return vcard([
    `N:${escapeText(card.familyName)};${escapeText(card.givenName)};;;`,
    `FN:${escapeText(card.name)}`,
    `ORG:${escapeText(ORG)}`,
    card.title && `TITLE:${escapeText(card.title)}`,
    `EMAIL;TYPE=INTERNET,WORK:${card.email}`,
    `URL:${cardUrl(card)}`,
    card.linkedin && `X-SOCIALPROFILE;TYPE=linkedin:${card.linkedin}`,
  ]);
}

/** The vCard the offline poster QR carries, for a room with no signal: the
 *  minimum a phone needs to save the contact (N, FN, ORG, TITLE, EMAIL, URL),
 *  kept short so the code stays a low version. URL is the tracked short link. */
export function offlineVcard(card: TeamCard): string {
  return vcard([
    `N:${escapeText(card.familyName)};${escapeText(card.givenName)};;;`,
    `FN:${escapeText(card.name)}`,
    `ORG:${escapeText(ORG)}`,
    card.title && `TITLE:${escapeText(card.title)}`,
    `EMAIL:${card.email}`,
    `URL:${shortUrl(card)}`,
  ]);
}

export interface QrOptions {
  errorCorrection: 'L' | 'M' | 'Q' | 'H';
  /** Quiet zone in modules; the white tile around the code adds the rest. */
  quietZone?: number;
}

/** A square-module, crisp-edged QR SVG on white. */
export function qrSvg(payload: string, { errorCorrection, quietZone = 2 }: QrOptions): string {
  const qr = createQr(payload, { errorCorrectionLevel: errorCorrection });
  const count = qr.modules.size;
  const total = count + quietZone * 2;
  const rects: string[] = [];
  for (let row = 0; row < count; row += 1) {
    for (let col = 0; col < count; col += 1) {
      if (!qr.modules.data[row * count + col]) continue;
      rects.push(`<rect x="${col + quietZone}" y="${row + quietZone}" width="1" height="1"/>`);
    }
  }
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" shape-rendering="crispEdges">` +
    `<rect width="${total}" height="${total}" fill="#ffffff"/>` +
    `<g fill="${QR_DARK}">${rects.join('')}</g></svg>`
  );
}

/** The tracked short-link QR: ECC Q, the level the presenter page shows. */
export function shortLinkQrSvg(card: TeamCard): string {
  return qrSvg(shortUrl(card), { errorCorrection: 'Q' });
}

/** The offline vCard QR: ECC M keeps the longer payload at a scannable size. */
export function offlineVcardQrSvg(card: TeamCard): string {
  return qrSvg(offlineVcard(card), { errorCorrection: 'M' });
}

export interface GeneratedFile {
  /** Relative to apps/web/public. */
  path: string;
  contents: string;
}

/** Every file under public/c that lib/team-cards.ts owns. */
export function teamCardFiles(cards: readonly TeamCard[]): GeneratedFile[] {
  return cards.flatMap(card => [
    { path: `c/${card.slug}.vcf`, contents: cardVcf(card) },
    { path: qrSrc(card).replace(/^\//, ''), contents: shortLinkQrSvg(card) },
  ]);
}

/** Guards the public-repo rule before anything is written. */
export function validateCard(card: TeamCard): string[] {
  const problems: string[] = [];
  if (!/^[a-z0-9-]{3,64}$/.test(card.slug))
    problems.push('slug must be 3-64 chars of a-z, 0-9, hyphen');
  if (!/^madf\.am\/[a-z0-9-]{3,64}$/.test(card.shortLink))
    problems.push('shortLink must be madf.am/{code}');
  if (!/^[^@\s]+@madfam\.io$/.test(card.email))
    problems.push('email must be a work @madfam.io address');
  if (card.linkedin && !/^https:\/\/www\.linkedin\.com\/in\/[^/\s]+\/?$/.test(card.linkedin)) {
    problems.push('linkedin must be https://www.linkedin.com/in/{handle}/');
  }
  if (!card.name.includes(card.givenName) || !card.name.includes(card.familyName)) {
    problems.push('name must contain givenName and familyName');
  }
  if (/\+?\d[\d\s().-]{7,}\d/.test(Object.values(card).join(' '))) {
    problems.push('looks like a phone number: this repo is public, work contact only');
  }
  if (shortSlug(card).length < 3) problems.push('short code too short');
  return problems.map(p => `${card.slug}: ${p}`);
}
