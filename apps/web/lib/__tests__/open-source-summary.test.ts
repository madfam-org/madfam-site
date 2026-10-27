import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PLATFORMS, getOpenSourceSummary } from '@/lib/data/platforms';

const translations = join(__dirname, '../../../../packages/i18n/src/translations');

// Ruling R57 b: "{n} de {m} plataformas publican su código", where n counts
// catalog platforms with an OSI-approved licence and a public repository.
describe('openness line', () => {
  it('counts OSI licence AND public repository, out of the whole catalog', () => {
    const { open, total } = getOpenSourceSummary();
    expect(total).toBe(PLATFORMS.length);
    const withPublicRepo = PLATFORMS.filter(p => p.githubUrl);
    expect(open).toBeLessThanOrEqual(withPublicRepo.length);
    // A product whose repository is private never counts, whatever its licence.
    expect(open).toBe(
      withPublicRepo.filter(p =>
        /^(A|L)?GPL-3\.0$|^Apache-2\.0$|^MIT$|^MPL-2\.0$|^BSD-[23]-Clause$/.test(p.license)
      ).length
    );
  });

  it.each(['es', 'en', 'pt'])('%s copy uses the computed count and names no licence', locale => {
    const corporate = JSON.parse(
      readFileSync(join(translations, locale, 'corporate.json'), 'utf8')
    );
    const text = JSON.stringify(corporate);
    expect(text).not.toContain('{agpl}');
    expect(text).toMatch(/\{open\}/);
    expect(text).not.toMatch(/publi\w+ (su|their|seu) c[oó]digo (bajo|under|sob) AGPL/i);
  });
});
