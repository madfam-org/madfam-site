import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { cardVcf, offlineVcard, teamCardFiles, validateCard } from '../../scripts/team-cards/files';
import { KALYA_DISCOVERY_EVENT_TYPE } from '../kalya-embed';
import { CARD_COPY, TEAM_CARDS, type TeamCard, appName, qrSrc, shortSlug } from '../team-cards';

const publicDir = join(__dirname, '../../public');

describe('team cards', () => {
  it.each(TEAM_CARDS.map(card => [card.slug, card] as const))(
    '%s prints a madf.am short link and ships its QR, vCard and presenter name',
    (_slug, card) => {
      expect(card.shortLink).toMatch(/^madf\.am\/[a-z0-9-]{3,64}$/);
      const qr = join(publicDir, qrSrc(card));
      expect(existsSync(qr)).toBe(true);
      // Square, crisp modules: the rounded mint style failed to decode (2026-10-28).
      expect(readFileSync(qr, 'utf8')).toContain('shape-rendering="crispEdges"');
      expect(existsSync(join(publicDir, `c/${card.slug}.vcf`))).toBe(true);
      expect(appName(card)).toBe(
        shortSlug(card).charAt(0).toUpperCase() + shortSlug(card).slice(1)
      );
    }
  );

  // public/c is generated from TEAM_CARDS; a hand edit on either side fails here.
  it.each(teamCardFiles(TEAM_CARDS).map(file => [file.path, file] as const))(
    'public/%s matches lib/team-cards.ts (regenerate: pnpm --filter @madfam-site/web team-cards)',
    (path, file) => {
      expect(readFileSync(join(publicDir, path), 'utf8')).toBe(file.contents);
    }
  );

  it('passes the work-contact-only rules', () => {
    expect(TEAM_CARDS.flatMap(validateCard)).toEqual([]);
    for (const card of TEAM_CARDS) {
      expect(cardVcf(card)).not.toMatch(/^TEL/m);
      expect(offlineVcard(card)).not.toMatch(/^TEL/m);
    }
  });

  it('writes a CRLF vCard with N, escaped text and no phone', () => {
    const card: TeamCard = {
      slug: 'ana-ejemplo',
      name: 'Ana de la Luz Ejemplo',
      givenName: 'Ana',
      familyName: 'de la Luz Ejemplo',
      email: 'ana@madfam.io',
      title: 'Design, Research; Ops',
      shortLink: 'madf.am/ana',
      bookingEventType: 'llamada-ana',
    };
    expect(offlineVcard(card).split('\r\n')).toEqual([
      'BEGIN:VCARD',
      'VERSION:3.0',
      'N:de la Luz Ejemplo;Ana;;;',
      'FN:Ana de la Luz Ejemplo',
      'ORG:MADFAM',
      'TITLE:Design\\, Research\\; Ops',
      'EMAIL:ana@madfam.io',
      'URL:https://madf.am/ana',
      'END:VCARD',
      '',
    ]);
    expect(validateCard({ ...card, email: 'ana@gmail.com' })).toHaveLength(1);
    expect(validateCard({ ...card, title: 'Cel. 55 1234 5678' })).toHaveLength(1);
  });

  it("books each teammate's own Kalya event type, never a shared one", () => {
    const eventTypes = TEAM_CARDS.map(card => card.bookingEventType);
    for (const eventType of eventTypes) {
      expect(eventType).toMatch(/^[a-z0-9-]{1,64}$/);
      expect(eventType).not.toBe(KALYA_DISCOVERY_EVENT_TYPE);
    }
    expect(new Set(eventTypes).size).toBe(eventTypes.length);
  });

  it("titles the booking dialog with the teammate's given name in every locale", () => {
    for (const copy of Object.values(CARD_COPY)) {
      expect(copy.bookTitle).toContain('{name}');
      expect(copy.bookSubtitle).not.toMatch(/MADFAM/);
    }
  });

  it('has presenter copy in every locale', () => {
    for (const copy of Object.values(CARD_COPY)) {
      expect(copy.present && copy.scanHint && copy.viewCard).toBeTruthy();
    }
  });

  it('ships the home-screen icons the presenter manifest names', () => {
    for (const icon of ['apple-touch-icon.png', 'icon-192.png', 'icon-512.png']) {
      expect(existsSync(join(publicDir, 'c/icons', icon))).toBe(true);
    }
  });
});
