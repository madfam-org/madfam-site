# Internationalization (i18n) Guide

## Overview

MADFAM's website supports multiple languages to serve our global AI consultancy market. The internationalization system is built with next-intl and supports Spanish (primary), English, and Portuguese with a sophisticated routing and translation management system.

## Supported Locales

| Locale  | Language                | Market                         | Status     | Completion |
| ------- | ----------------------- | ------------------------------ | ---------- | ---------- |
| `es-MX` | Spanish (Mexico)        | Primary market, Latin America  | Production | 100%       |
| `en-US` | English (United States) | Global business, North America | Production | 95%        |
| `pt-BR` | Portuguese (Brazil)     | Brazilian market expansion     | Beta       | 80%        |

## Architecture

### **Routing Strategy**

The site uses **path-based routing** with locale prefixes:

- `madfam.io/es-MX/` - Spanish (default)
- `madfam.io/en-US/` - English
- `madfam.io/pt-BR/` - Portuguese

### **Next.js Integration**

Built with `next-intl` for seamless Next.js 14 App Router integration:

```typescript
// middleware.ts
import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['es-MX', 'en-US', 'pt-BR'],
  defaultLocale: 'es-MX',
  pathnames: {
    '/': '/',
    '/about': {
      'es-MX': '/acerca',
      'en-US': '/about',
      'pt-BR': '/sobre',
    },
  },
});
```

---

## Translation System

### **File Structure**

```
packages/i18n/src/translations/
├── es-MX.json          # Spanish (primary)
├── en-US.json          # English
└── pt-BR.json          # Portuguese

apps/web/
├── i18n.config.ts      # Configuration
├── middleware.ts       # Routing logic
└── app/[locale]/       # Localized pages
```

### **Translation Keys Structure**

Hierarchical organization for maintainability:

```json
{
  "navigation": {
    "home": "Inicio",
    "services": "Servicios",
    "products": "Productos",
    "about": "Acerca",
    "contact": "Contacto"
  },
  "home": {
    "hero": {
      "title": "Donde la IA encuentra la creatividad humana",
      "subtitle": "MADFAM transforma empresas con soluciones impulsadas por IA",
      "cta": "Comenzar ahora"
    },
    "services": {
      "title": "Nuestros Servicios",
      "designFabrication": {
        "title": "Diseño y Fabricación",
        "description": "Servicios de diseño 3D, gráfico y fabricación digital"
      }
    }
  }
}
```

### **Business Context Keys**

Service tier translations maintain consistency across all content:

```json
{
  "programs": {
    "types": {
      "DESIGN_FABRICATION": "Diseño y Fabricación",
      "STRATEGY_ENABLEMENT": "Estrategia y Habilitación",
      "PLATFORM_PILOTS": "Pilotos de Plataforma",
      "STRATEGIC_PARTNERSHIPS": "Alianzas Estratégicas"
    }
  },
  "products": {
    "SPARK": {
      "name": "SPARK",
      "tagline": "Orquestación de IA",
      "description": "Plataforma completa para automatización inteligente"
    },
    "PENNY": {
      "name": "PENNY",
      "tagline": "Automatización de procesos",
      "description": "Herramienta especializada en optimización de flujos"
    }
  }
}
```

---

## Implementation Patterns

### **Server Components**

```tsx
// app/[locale]/page.tsx
import { getTranslations } from 'next-intl/server';

export default async function HomePage() {
  const t = await getTranslations('home');

  return (
    <main>
      <h1>{t('hero.title')}</h1>
      <p>{t('hero.subtitle')}</p>
      <button>{t('hero.cta')}</button>
    </main>
  );
}
```

### **Client Components**

```tsx
// components/ContactForm.tsx
'use client';
import { useTranslations } from 'next-intl';

export function ContactForm() {
  const t = useTranslations('contact');

  return (
    <form>
      <label>{t('form.name')}</label>
      <input placeholder={t('form.namePlaceholder')} />
      <button>{t('form.submit')}</button>
    </form>
  );
}
```

### **Dynamic Routing**

Localized routes with different paths per language:

```typescript
// lib/route-translations.ts
export const routeTranslations = {
  '/programs': {
    'es-MX': '/programas',
    'en-US': '/programs',
    'pt-BR': '/programas',
  },
  '/products/spark': {
    'es-MX': '/productos/spark',
    'en-US': '/products/spark',
    'pt-BR': '/produtos/spark',
  },
};
```

### **Business Logic Integration**

Service tier and product information maintains consistency:

```tsx
// components/ServiceTierCard.tsx
export function ServiceTierCard({ tier }: { tier: ServiceTier }) {
  const t = useTranslations('services.tiers');

  return (
    <div className="service-card">
      <h3>{t(tier)}</h3>
      <p>{t(`${tier}.description`)}</p>
    </div>
  );
}
```

---

## Language Switching

### **Language Switcher Component**

```tsx
// components/LanguageSwitcher.tsx
'use client';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';

const languages = [
  { code: 'es-MX', name: 'Español', flag: '🇲🇽' },
  { code: 'en-US', name: 'English', flag: '🇺🇸' },
  { code: 'pt-BR', name: 'Português', flag: '🇧🇷' },
];

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();

  const handleLanguageChange = (newLocale: string) => {
    // Preserve current path and switch locale
    const currentPath = window.location.pathname.replace(`/${locale}`, '');
    router.push(`/${newLocale}${currentPath}`);
  };

  return (
    <select value={locale} onChange={e => handleLanguageChange(e.target.value)}>
      {languages.map(lang => (
        <option key={lang.code} value={lang.code}>
          {lang.flag} {lang.name}
        </option>
      ))}
    </select>
  );
}
```

### **URL Preservation**

When switching languages, the system preserves the user's current page context:

- `/es/programas#strategy-enablement` → `/en/programs#strategy-enablement`
- Query parameters are maintained
- Scroll position is preserved when possible

---

## Translation Workflow

### **Adding New Content**

1. **Add Spanish first** (primary language):

```json
// es-MX.json
{
  "assessment": {
    "new_feature": {
      "title": "Nueva Evaluación IA",
      "description": "Descubre tu nivel de preparación para IA"
    }
  }
}
```

2. **Add English translation**:

```json
// en-US.json
{
  "assessment": {
    "new_feature": {
      "title": "New AI Assessment",
      "description": "Discover your AI readiness level"
    }
  }
}
```

3. **Add Portuguese translation**:

```json
// pt-BR.json
{
  "assessment": {
    "new_feature": {
      "title": "Nova Avaliação de IA",
      "description": "Descubra seu nível de prontidão para IA"
    }
  }
}
```

### **Translation Guidelines**

#### **Spanish (es-MX)**

- **Tone**: Professional but approachable
- **Formality**: Use "usted" for business contexts
- **Technical Terms**: Prefer Spanish equivalents when clear
- **Examples**:
  - "Artificial Intelligence" → "Inteligencia Artificial"
  - "Automation" → "Automatización"
  - "Workflow" → "Flujo de trabajo"

#### **English (en-US)**

- **Tone**: Professional and direct
- **Style**: American English spelling and terminology
- **Technical Terms**: Use industry-standard terms
- **Examples**:
  - "Optimization" (not "Optimisation")
  - "Analyze" (not "Analyse")

#### **Portuguese (pt-BR)**

- **Tone**: Professional with Brazilian warmth
- **Style**: Brazilian Portuguese conventions
- **Technical Terms**: Use established Brazilian tech terminology
- **Examples**:
  - "Software" → "Software" (unchanged)
  - "Workflow" → "Fluxo de trabalho"
  - "Dashboard" → "Painel de controle"

### **Quality Assurance**

1. **Context Review**: Ensure translations fit the business context
2. **Technical Accuracy**: Verify service tier and product names are consistent
3. **Cultural Adaptation**: Adjust content for local market preferences
4. **Length Considerations**: Account for text expansion/contraction in UI layouts

---

## SEO & Metadata

### **Localized SEO**

Each language has optimized metadata:

```tsx
// lib/seo.ts
export function generateLocalizedMetadata(locale: string, page: string) {
  const metadata = {
    'es-MX': {
      title: 'MADFAM - Consultoría IA México | Automatización Empresarial',
      description:
        'Transformamos empresas mexicanas con IA. Desde diseño 3D hasta vCTO estratégico.',
      keywords: 'IA México, automatización, consultoría tecnológica, transformación digital',
    },
    'en-US': {
      title: 'MADFAM - AI Consultancy | Business Automation Solutions',
      description:
        'Transform your business with AI-driven solutions. From 3D design to strategic vCTO partnerships.',
      keywords: 'AI consultancy, business automation, digital transformation, strategic technology',
    },
  };

  return metadata[locale] || metadata['es-MX'];
}
```

### **Structured Data**

Localized structured data for better search visibility:

```tsx
// components/StructuredData.tsx
export function LocalizedStructuredData({ locale }: { locale: string }) {
  const t = useTranslations('structured_data');

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'MADFAM',
    description: t('company.description'),
    url: `https://madfam.io/${locale}`,
    sameAs: ['https://linkedin.com/company/madfam', 'https://twitter.com/madfam_io'],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
```

---

## Developer Tools

### **Translation Helper Hooks**

```tsx
// hooks/useTypedTranslations.ts
import { useTranslations } from 'next-intl';

export function useServiceTranslations() {
  return useTranslations('services');
}

export function useProductTranslations() {
  return useTranslations('products');
}

// Type-safe translation keys
export function useAssessmentTranslations() {
  const t = useTranslations('assessment');

  return {
    title: t('title'),
    questions: (index: number) => t(`questions.${index}`),
    results: {
      strengths: t('results.strengths'),
      weaknesses: t('results.weaknesses'),
    },
  };
}
```

### **Missing Translation Detection**

Development tool to identify incomplete translations:

```tsx
// lib/translation-utils.ts
export function findMissingTranslations() {
  const baseLocale = 'es-MX';
  const baseTranslations = require(`../i18n/${baseLocale}.json`);

  ['en-US', 'pt-BR'].forEach(locale => {
    const translations = require(`../i18n/${locale}.json`);
    const missing = findMissingKeys(baseTranslations, translations);

    if (missing.length > 0) {
      console.warn(`Missing translations in ${locale}:`, missing);
    }
  });
}
```

### **Translation Testing**

```tsx
// __tests__/translations.test.ts
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

describe('Translations', () => {
  ['es-MX', 'en-US', 'pt-BR'].forEach(locale => {
    it(`renders correctly in ${locale}`, async () => {
      const messages = await import(`../i18n/${locale}.json`);

      render(
        <NextIntlClientProvider locale={locale} messages={messages}>
          <HomePage />
        </NextIntlClientProvider>
      );

      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });
  });
});
```

---

## Performance Optimization

### **Bundle Splitting**

Translations are split by locale to reduce bundle size:

```typescript
// i18n.config.ts
export async function getMessages(locale: string) {
  try {
    return (await import(`./translations/${locale}.json`)).default;
  } catch (error) {
    // Fallback to Spanish
    return (await import('./translations/es-MX.json')).default;
  }
}
```

### **Caching Strategy**

- **Static translations**: Cached indefinitely
- **Dynamic content**: Revalidated per deployment
- **User preferences**: Stored in localStorage/cookies

---

## Common Issues & Solutions

### **Text Expansion**

Different languages have different text lengths:

```css
/* Account for text expansion */
.button {
  min-width: 120px; /* English: "Submit" vs Spanish: "Enviar formulario" */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
```

### **Date and Number Formatting**

```tsx
// utils/formatting.ts
export function formatDate(date: Date, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export function formatCurrency(amount: number, locale: string) {
  const currency = locale === 'es-MX' ? 'MXN' : 'USD';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
}
```

### **RTL Languages (Future)**

Prepared architecture for right-to-left languages:

```css
/* CSS logical properties for future RTL support */
.container {
  margin-inline-start: 1rem;
  padding-inline-end: 2rem;
  border-inline-start: 1px solid #ccc;
}
```

---

## Analytics & Tracking

### **Locale-Specific Analytics**

```tsx
// Track language usage
analytics.track('language_switched', {
  from: previousLocale,
  to: newLocale,
  page: currentPage,
  user_segment: userType,
});

// Track content engagement by language
analytics.track('content_engagement', {
  locale: currentLocale,
  page: pageName,
  time_on_page: timeSpent,
  scroll_depth: scrollPercentage,
});
```

### **Conversion Tracking**

Monitor business performance across languages:

```tsx
// Lead generation by locale
analytics.track('lead_generated', {
  locale: locale,
  tier: selectedTier,
  source: 'website',
  language_preference: detectedLanguage,
});
```

---

## Future Roadmap

### **Planned Enhancements**

1. **Additional Languages**: French (Canada), German (business expansion)
2. **Regional Variants**:
   - `es-AR` (Argentina)
   - `es-ES` (Spain)
   - `pt-PT` (Portugal)
3. **Advanced Features**:
   - Real-time translation updates
   - A/B testing for translated content
   - AI-powered translation suggestions
   - Voice/audio content localization

### **Technical Improvements**

- **Translation Management Platform**: Integration with Crowdin/Lokalise
- **Automated Translation Pipeline**: CI/CD integration for translation updates
- **Content Localization**: Beyond text (images, videos, cultural adaptations)
- **Performance**: Further optimization for multi-locale bundles

---

## Best Practices Summary

✅ **Do:**

- Always add Spanish translations first (primary market)
- Test UI layouts with longer/shorter text in all languages
- Use semantic translation keys (`home.hero.title` vs `title1`)
- Implement proper fallbacks to Spanish
- Consider cultural context, not just literal translation
- Test forms and user flows in all languages

❌ **Don't:**

- Hardcode text strings in components
- Use machine translations without human review
- Ignore text expansion/contraction in designs
- Mix translation keys inconsistently
- Skip testing edge cases in non-primary languages
- Assume one-to-one translation mapping

---

Built with ❤️ by MADFAM - Donde la IA encuentra la creatividad humana
