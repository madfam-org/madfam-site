import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CARD_COPY, TEAM_CARDS, appName, qrSrc, shortSlug } from '../team-cards';

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
