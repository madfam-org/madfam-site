import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Impact & SDG Features', () => {
  describe('Translation Files', () => {
    it('should have impact translations in all languages', () => {
      const languages = ['en', 'es', 'pt'];
      languages.forEach(lang => {
        const impactPath = path.join(
          __dirname,
          `../../../packages/i18n/src/translations/${lang}/impact.json`
        );
        const commonPath = path.join(
          __dirname,
          `../../../packages/i18n/src/translations/${lang}/common.json`
        );
        const corporatePath = path.join(
          __dirname,
          `../../../packages/i18n/src/translations/${lang}/corporate.json`
        );

        // Check impact.json exists
        expect(fs.existsSync(impactPath)).toBe(true);

        // Check impact.json has required keys
        const impactContent = JSON.parse(fs.readFileSync(impactPath, 'utf-8'));
        expect(impactContent).toHaveProperty('meta');
        expect(impactContent).toHaveProperty('hero');
        expect(impactContent).toHaveProperty('sdgAlignment');
        expect(impactContent).toHaveProperty('sdgMap');
        expect(impactContent).toHaveProperty('pillars');
        expect(impactContent).toHaveProperty('cta');

        // Check common.json has impact nav key
        const commonContent = JSON.parse(fs.readFileSync(commonPath, 'utf-8'));
        expect(commonContent.nav).toHaveProperty('impact');

        // Check corporate.json has purpose, mission, vision, pillars
        const corporateContent = JSON.parse(fs.readFileSync(corporatePath, 'utf-8'));
        expect(corporateContent).toHaveProperty('purpose');
        expect(corporateContent).toHaveProperty('mission');
        expect(corporateContent).toHaveProperty('vision');
        expect(corporateContent).toHaveProperty('pillars');
      });
    });

    it('should not have placeholder tokens in translations', () => {
      const languages = ['en', 'es', 'pt'];
      languages.forEach(lang => {
        const impactPath = path.join(
          __dirname,
          `../../../packages/i18n/src/translations/${lang}/impact.json`
        );
        const corporatePath = path.join(
          __dirname,
          `../../../packages/i18n/src/translations/${lang}/corporate.json`
        );

        const impactContent = fs.readFileSync(impactPath, 'utf-8');
        const corporateContent = fs.readFileSync(corporatePath, 'utf-8');

        // Check for common placeholder patterns
        // Use word boundaries to avoid matching Spanish "todos" (meaning "all")
        expect(impactContent).not.toMatch(/\{\{.*\}\}/);
        expect(impactContent).not.toMatch(/\[.*\]/);
        expect(impactContent).not.toMatch(/\bTODO\b/);
        expect(impactContent).not.toMatch(/\bFIXME\b/);

        expect(corporateContent).not.toMatch(/\{\{.*\}\}/);
        expect(corporateContent).not.toMatch(/\bTODO\b/);
        expect(corporateContent).not.toMatch(/\bFIXME\b/);
      });
    });
  });

  describe('Page Components', () => {
    it('should have Impact page component', () => {
      const impactPagePath = path.join(__dirname, '../app/[locale]/impact/page.tsx');
      expect(fs.existsSync(impactPagePath)).toBe(true);

      const content = fs.readFileSync(impactPagePath, 'utf-8');
      // Check for essential imports and elements
      expect(content).toContain('SDGMapping');
      expect(content).toContain('getTranslations');
      expect(content).toContain('Container');
      expect(content).toContain('sdgMappings');
    });

    it('should have SDGBadge component', () => {
      const badgePath = path.join(__dirname, '../components/SDGBadge.tsx');
      expect(fs.existsSync(badgePath)).toBe(true);

      const content = fs.readFileSync(badgePath, 'utf-8');
      expect(content).toContain('SDGBadge');
      expect(content).toContain('SDGInlineBadge');
      expect(content).toContain('getSDGColor');
    });
  });

  describe('Navigation', () => {
    it('should have Impact link in navigation', () => {
      const navbarPath = path.join(__dirname, '../components/Navbar.tsx');
      const content = fs.readFileSync(navbarPath, 'utf-8');

      expect(content).toContain("t('impact')");
      expect(content).toContain("getLocalizedUrl('impact', locale)");
    });
  });

  describe('SDG Mapping Consistency', () => {
    it('should have valid SDG numbers (1-17)', () => {
      const languages = ['en', 'es', 'pt'];
      languages.forEach(lang => {
        const impactPath = path.join(
          __dirname,
          `../../../packages/i18n/src/translations/${lang}/impact.json`
        );
        const impactContent = JSON.parse(fs.readFileSync(impactPath, 'utf-8'));

        Object.values(impactContent.sdgMap).forEach((mapping: any) => {
          if (mapping.sdgs) {
            mapping.sdgs.forEach((sdg: string) => {
              const match = sdg.match(/\d+/);
              if (match) {
                const sdgNumber = parseInt(match[0]);
                expect(sdgNumber).toBeGreaterThanOrEqual(1);
                expect(sdgNumber).toBeLessThanOrEqual(17);
              }
            });
          }
        });
      });
    });
  });

  describe('Product Integration', () => {
    it('should have SDG support in ProductCard', () => {
      // Check ProductCard imports SDGBadge and supports sdgs prop
      const cardPath = path.join(__dirname, '../components/corporate/ProductCard.tsx');
      const cardContent = fs.readFileSync(cardPath, 'utf-8');
      expect(cardContent).toContain('SDGInlineBadge');
      expect(cardContent).toContain('product.sdgs');
    });

    it('should have platform data registry', () => {
      const registryPath = path.join(__dirname, '../lib/data/platforms.ts');
      expect(fs.existsSync(registryPath)).toBe(true);
      const content = fs.readFileSync(registryPath, 'utf-8');
      expect(content).toContain('PLATFORMS');
      expect(content).toContain('getPlatformBySlug');
    });
  });
});

describe('Content Validation', () => {
  it('should have no mixed language fragments', () => {
    const checkFile = (filePath: string, expectedLang: string) => {
      if (!fs.existsSync(filePath)) return;

      const content = fs.readFileSync(filePath, 'utf-8');
      const jsonContent = JSON.parse(content);

      const checkObject = (obj: any, path: string = '') => {
        Object.entries(obj).forEach(([key, value]) => {
          if (typeof value === 'string' && value.length > 10) {
            // Basic checks for mixed languages (case-sensitive to avoid false positives like "UN")
            if (expectedLang === 'en') {
              expect(value).not.toMatch(/\b(el|la|los|las|una)\b/i);
              // Check for lowercase Spanish "un" only to avoid matching "UN" (United Nations)
              expect(value).not.toMatch(/\bun\b(?![A-Z])/);
            } else if (expectedLang === 'es') {
              expect(value).not.toMatch(/\b(the|and|or|with)\b/i);
            } else if (expectedLang === 'pt') {
              expect(value).not.toMatch(/\b(the|and|el|la)\b/i);
            }
          } else if (typeof value === 'object' && value !== null) {
            checkObject(value, `${path}.${key}`);
          }
        });
      };

      checkObject(jsonContent);
    };

    const languages = [
      { code: 'en', name: 'English' },
      { code: 'es', name: 'Spanish' },
      { code: 'pt', name: 'Portuguese' },
    ];

    languages.forEach(({ code }) => {
      const impactPath = path.join(
        __dirname,
        `../../../packages/i18n/src/translations/${code}/impact.json`
      );
      checkFile(impactPath, code);
    });
  });
});
