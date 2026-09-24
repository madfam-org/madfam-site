> **ARCHIVED — historical record, not current guidance** (banner added 2026-09-23).
> Names, hosts, products and procedures below may be retired — e.g. PENNY, SPARK,
> penny.onl, forgesight.quest, and Vercel / Railway / GitHub Pages hosting. Current
> sources: [`AGENTS.md`](/AGENTS.md), [`ECOSYSTEM.md`](/ECOSYSTEM.md) and
> [`docs/deployment/DEPLOYMENT.md`](/docs/deployment/DEPLOYMENT.md).

# Language & Internationalization Fixes

## Critical Issues & Solutions

### Issue 1: Hardcoded Text in HomePage.tsx

The `HomePage.tsx` component contains extensive hardcoded English text that prevents proper internationalization.

#### Affected Lines & Fixes

**Service Tiers (Lines 61-86)**

```tsx
// ❌ CURRENT (Hardcoded)
<h3 className="text-xl font-heading font-semibold mb-2">L1 - Essentials</h3>
<p className="text-obsidian/70 mb-4">Quick AI solutions for immediate impact</p>
<Button variant="outline" size="sm">Learn More</Button>

// ✅ FIXED
<h3 className="text-xl font-heading font-semibold mb-2">{t('services.level1.title')}</h3>
<p className="text-obsidian/70 mb-4">{t('services.level1.quickDescription')}</p>
<Button variant="outline" size="sm">{t('common.cta.learnMore')}</Button>
```

**Products Section (Lines 109-122)**

```tsx
// ❌ CURRENT (Hardcoded)
<h3 className="text-2xl font-heading font-bold mb-4">SPARK</h3>
<Button variant="primary">Learn More</Button>

// ✅ FIXED
<h3 className="text-2xl font-heading font-bold mb-4">{t('products.spark.name')}</h3>
<Button variant="primary">{t('common.cta.learnMore')}</Button>
```

**Hero Title Split (Lines 26-27)**

```tsx
// ❌ CURRENT (Language-specific split)
{
  t('home.hero.title').split('human creativity')[0];
}
<span className="gradient-text">{t('home.hero.title').split('meets ')[1]}</span>;

// ✅ FIXED (Use separate translation keys)
{
  t('home.hero.titlePart1');
}
<span className="gradient-text">{t('home.hero.titlePart2')}</span>;
```

### Issue 2: Missing Translation Keys

Add these keys to all language files:

#### `/packages/i18n/src/translations/en/services.json`

```json
{
  "level1": {
    "quickDescription": "Quick AI solutions for immediate impact"
  },
  "level2": {
    "quickDescription": "Comprehensive AI automation solutions"
  },
  "level3": {
    "quickDescription": "Strategic AI transformation guidance"
  }
}
```

#### `/packages/i18n/src/translations/es/services.json`

```json
{
  "level1": {
    "quickDescription": "Soluciones rápidas de IA para impacto inmediato"
  },
  "level2": {
    "quickDescription": "Soluciones integrales de automatización con IA"
  },
  "level3": {
    "quickDescription": "Guía estratégica de transformación con IA"
  }
}
```

#### `/packages/i18n/src/translations/pt-br/services.json`

```json
{
  "level1": {
    "quickDescription": "Soluções rápidas de IA para impacto imediato"
  },
  "level2": {
    "quickDescription": "Soluções abrangentes de automação com IA"
  },
  "level3": {
    "quickDescription": "Orientação estratégica de transformação com IA"
  }
}
```

### Issue 3: HomePage Component Not Used

The application is using `CorporateHomePage` instead of `HomePage`, but HomePage still contains hardcoded text.

**Solution**: Either:

1. Remove HomePage.tsx if not needed
2. Fix all hardcoded text as shown above

### Issue 4: Improve Language Detection

Add geo-based detection to middleware:

```typescript
// apps/web/middleware.ts

import { geolocation } from '@vercel/functions';

function getPreferredLocale(request: NextRequest): string {
  // 1. Check cookie preference
  const cookieLocale = request.cookies.get('locale')?.value;
  if (cookieLocale && i18nConfig.locales.includes(cookieLocale as any)) {
    return cookieLocale;
  }

  // 2. Geo-based detection
  const geo = geolocation(request);
  const countryToLocale: Record<string, string> = {
    MX: 'es',
    ES: 'es',
    AR: 'es',
    CO: 'es',
    CL: 'es',
    PE: 'es',
    BR: 'pt-br',
    PT: 'pt-br',
    US: 'en',
    GB: 'en',
    CA: 'en',
  };

  const geoLocale = geo?.country ? countryToLocale[geo.country] : null;
  if (geoLocale && i18nConfig.locales.includes(geoLocale as any)) {
    return geoLocale;
  }

  // 3. Browser language preference
  const acceptLanguage = request.headers.get('accept-language');
  if (acceptLanguage) {
    const languages = acceptLanguage.split(',');
    for (const lang of languages) {
      const locale = lang.split('-')[0].trim();
      if (locale === 'es') return 'es';
      if (locale === 'pt') return 'pt-br';
      if (locale === 'en') return 'en';
    }
  }

  // 4. Default to Spanish
  return 'es';
}
```

## Implementation Steps

1. **Fix HomePage.tsx** (if keeping it):
   - Replace all hardcoded text with translation keys
   - Update hero title to use separate keys instead of split

2. **Update Translation Files**:
   - Add missing keys for service quick descriptions
   - Add split hero title keys
   - Ensure all "Learn More" uses `common.cta.learnMore`

3. **Enhance Middleware**:
   - Add geo-location detection
   - Implement cookie-based preference storage
   - Improve browser language detection

4. **Add Language Switcher**:
   - Save preference to cookie
   - Update URL with new locale
   - Refresh page content

## Testing Checklist

- [ ] Load site without locale in URL → Should redirect to /es (Spanish)
- [ ] Access from Mexico IP → Should default to Spanish
- [ ] Access from Brazil IP → Should default to Portuguese
- [ ] Access from US IP → Should default to English
- [ ] Switch language → Should save preference
- [ ] All text elements translate properly
- [ ] No hardcoded English text visible in any locale

## Priority

**HIGH**: Fix hardcoded text in HomePage.tsx or remove if unused
**HIGH**: Add missing translation keys
**MEDIUM**: Implement geo-based detection
**LOW**: Enhance language switcher with cookie storage

---

_Last Updated: November 2024_
