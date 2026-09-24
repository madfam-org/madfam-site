> **ARCHIVED — historical record, not current guidance** (banner added 2026-09-23).
> Names, hosts, products and procedures below may be retired — e.g. PENNY, SPARK,
> penny.onl, forgesight.quest, and Vercel / Railway / GitHub Pages hosting. Current
> sources: [`AGENTS.md`](/AGENTS.md), [`ECOSYSTEM.md`](/ECOSYSTEM.md) and
> [`docs/deployment/DEPLOYMENT.md`](/docs/deployment/DEPLOYMENT.md).

# Missing Translation Keys Report

## Overview

This report identifies hardcoded text in the codebase that should be translated, as well as potential missing translation keys.

## Files with Hardcoded Text

### 1. `/app/[locale]/calculator/page.tsx`

Missing translation keys:

- Page metadata (title, description) - currently hardcoded in Spanish
- `"Visualiza el impacto que MADFAM puede tener en tu negocio"`
- `"Selecciona un nivel de servicio para calcular el ROI específico, o usa los valores predeterminados para una estimación general."`
- `"¿Listo para transformar tu negocio?"`
- `"Nuestro equipo de expertos puede ayudarte a implementar soluciones que generen resultados reales y medibles."`
- `"Solicitar consulta"`
- `"Ver servicios"`

### 2. `/app/[locale]/contact/page.tsx`

Missing translation keys:

- `"Hablemos sobre tu"`
- `"próximo proyecto"`
- `"Estamos listos para ayudarte a transformar tu empresa con IA. Cuéntanos tus necesidades y encontraremos la solución perfecta."`
- `"Solicita información"`
- `"Otras formas de contactarnos"`
- `"Email"`
- `"WhatsApp"`
- `"Ubicación"`
- `"Ciudad de México, México"`
- `"Servicio remoto global"`
- `"Horario de atención"`
- `"Lunes - Viernes"`
- `"Sábado"`
- `"Domingo"`
- `"Cerrado"`
- `"Respondemos en menos de 24 horas hábiles"`
- `"¿Necesitas ayuda inmediata?"`
- `"Agenda una videollamada de 15 minutos para resolver tus dudas"`
- `"Agendar llamada rápida →"`

### 3. `/app/[locale]/estimator/page.tsx`

Missing translation keys:

- Page metadata (title, description) - currently hardcoded in Spanish
- `"Obtén una cotización instantánea para tu proyecto"`
- `"¿Por qué confiar en nuestras estimaciones?"`
- `"Experiencia comprobada"`
- `"Más de 100 proyectos exitosos nos respaldan"`
- `"Transparencia total"`
- `"Sin costos ocultos ni sorpresas en el camino"`
- `"Metodología ágil"`
- `"Entregas incrementales y ajustes sobre la marcha"`
- `"Estas estimaciones son aproximadas y pueden variar según los requisitos específicos del proyecto. Contáctanos para obtener una propuesta detallada y personalizada."`

### 4. `/components/ShowcaseContent.tsx`

Missing translation keys:

- `"Component Showcase"`
- `"Toggle Dark Mode"`
- `"Button Variants"`
- `"Primary"`
- `"Secondary"`
- `"Creative"`
- `"Outline"`
- `"Ghost"`
- `"Danger"`
- `"Success"`
- `"Loading"`
- `"With Icon"`
- `"Service Cards"`
- `"Recommended"`
- `"Interactive Calculator Coming Soon!"`
- `"ROI Calculator Active!"`
- `"This section is shown because the INTERACTIVE_CALCULATOR feature flag is enabled."`
- `"Product Cards"`
- `"Key Features"`
- `"CAPABILITIES"`
- `"Everything you need to transform your business with AI"`
- `"Testimonials"`
- Various testimonial quotes and author information

### 5. Page Metadata

Several pages have hardcoded metadata that should be translated:

- `/app/[locale]/calculator/page.tsx`: Spanish metadata
- `/app/[locale]/estimator/page.tsx`: Spanish metadata

## Suggested Translation Key Structure

```json
{
  "calculator": {
    "meta": {
      "title": "ROI Calculator - MADFAM",
      "description": "Discover the potential return on investment of our digital transformation and AI consulting services."
    },
    "hero": {
      "subtitle": "Visualize the impact MADFAM can have on your business"
    },
    "instructions": "Select a service level to calculate specific ROI, or use default values for a general estimate.",
    "cta": {
      "title": "Ready to transform your business?",
      "subtitle": "Our team of experts can help you implement solutions that generate real, measurable results.",
      "requestConsultation": "Request consultation",
      "viewServices": "View services"
    }
  },
  "contact": {
    "hero": {
      "titlePrefix": "Let's talk about your",
      "titleHighlight": "next project",
      "subtitle": "We're ready to help you transform your company with AI. Tell us your needs and we'll find the perfect solution."
    },
    "form": {
      "title": "Request information"
    },
    "alternativeContact": {
      "title": "Other ways to contact us",
      "location": "Location",
      "city": "Mexico City, Mexico",
      "remoteService": "Global remote service",
      "businessHours": "Business hours",
      "weekdays": "Monday - Friday",
      "saturday": "Saturday",
      "sunday": "Sunday",
      "closed": "Closed",
      "responseTime": "We respond within 24 business hours"
    },
    "immediateHelp": {
      "title": "Need immediate help?",
      "subtitle": "Schedule a 15-minute video call to resolve your questions",
      "scheduleCall": "Schedule quick call →"
    }
  },
  "estimator": {
    "meta": {
      "title": "Project Estimator - MADFAM",
      "description": "Get an instant estimate for your digital transformation project. Price, time, and recommended team."
    },
    "hero": {
      "subtitle": "Get an instant quote for your project"
    },
    "trust": {
      "title": "Why trust our estimates?",
      "experience": {
        "title": "Proven experience",
        "description": "Over 100 successful projects back us up"
      },
      "transparency": {
        "title": "Total transparency",
        "description": "No hidden costs or surprises along the way"
      },
      "methodology": {
        "title": "Agile methodology",
        "description": "Incremental deliveries and on-the-fly adjustments"
      }
    },
    "disclaimer": "These estimates are approximate and may vary according to specific project requirements. Contact us for a detailed and personalized proposal."
  },
  "showcase": {
    "title": "Component Showcase",
    "toggleDarkMode": "Toggle Dark Mode",
    "sections": {
      "buttons": "Button Variants",
      "services": "Service Cards",
      "products": "Product Cards",
      "features": "Key Features",
      "testimonials": "Testimonials"
    },
    "buttons": {
      "primary": "Primary",
      "secondary": "Secondary",
      "creative": "Creative",
      "outline": "Outline",
      "ghost": "Ghost",
      "danger": "Danger",
      "success": "Success",
      "loading": "Loading",
      "withIcon": "With Icon"
    },
    "badges": {
      "recommended": "Recommended",
      "popular": "Popular"
    },
    "featureFlag": {
      "comingSoon": "Interactive Calculator Coming Soon!",
      "active": "ROI Calculator Active!",
      "activeDescription": "This section is shown because the INTERACTIVE_CALCULATOR feature flag is enabled."
    },
    "features": {
      "subtitle": "CAPABILITIES",
      "description": "Everything you need to transform your business with AI"
    }
  },
  "common": {
    "metadata": {
      "email": "Email",
      "whatsapp": "WhatsApp"
    }
  }
}
```

## Recommendations

1. **Create translation keys for all hardcoded text** identified above
2. **Update page metadata** to use translations instead of hardcoded strings
3. **Standardize common UI terms** (Loading, Error, Success, etc.) in the common section
4. **Add missing keys** to all three language files (en-US.json, es-MX.json, pt-BR.json)
5. **Consider creating a linting rule** to catch hardcoded text in future development

## Next Steps

1. Add the missing translation keys to the i18n package
2. Update the affected components to use the translation keys
3. Test all three languages to ensure proper display
4. Consider implementing a translation management system for easier maintenance
