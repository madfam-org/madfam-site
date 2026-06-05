import React from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { render as rtlRender, type RenderResult } from '@testing-library/react';

const messages = {
  common: {
    footer: {
      rights: 'All rights reserved',
      privacy: 'Privacy',
      terms: 'Terms',
    },
  },
  // Top-level leadForm namespace (used by useTranslations('leadForm'))
  leadForm: {
    fields: {
      name: 'Name',
      email: 'Email',
      company: 'Company',
      phone: 'Phone',
      intent: 'What brings you here?',
      timeline: 'Timeline',
      budget: 'Expected budget or commercial scale',
      region: 'Region',
      followUp: 'Preferred follow-up',
      message: 'How can we help you?',
    },
    placeholders: {
      name: 'Your name',
      email: 'your@email.com',
      company: 'Your company name',
      phone: '+1 555 123 4567',
      region: 'Mexico City, LATAM, US, remote...',
      message: 'Tell us about your project or needs...',
    },
    options: {
      select: 'Select an option',
    },
    intents: {
      platform: 'I want to use a MADFAM platform',
      'build-with-madfam': 'I want MADFAM to build or launch something with us',
      'ecosystem-membership': 'I want to join the ecosystem',
      'partner-invest': 'I want to partner, integrate, or invest',
      support: 'I need support or have another question',
    },
    timelines: {
      now: 'Now / urgent',
      '30-days': 'Within 30 days',
      quarter: 'This quarter',
      exploring: 'Exploring options',
    },
    budgets: {
      'not-sure': 'Not sure yet',
      'under-100k-mxn': 'Under MXN$100k',
      '100k-500k-mxn': 'MXN$100k-MXN$500k',
      '500k-plus-mxn': 'MXN$500k+',
    },
    followUp: {
      email: 'Email',
      whatsapp: 'WhatsApp',
      call: 'Call',
    },
    errors: {
      nameMin: 'Name is required',
      emailInvalid: 'Invalid email',
      intentRequired: 'Select the path that best matches your intent',
      timelineRequired: 'Select a timeline',
      regionRequired: 'Tell us your region',
      followUpRequired: 'Select a follow-up channel',
      messageMin: 'Message is required',
    },
    messages: {
      success: 'Thank you for your interest. We will contact you soon.',
      error: 'An error occurred. Please try again.',
    },
    requiredFields: 'Required fields',
    submit: 'Send Inquiry',
  },
  footer: {
    tagline: 'Where AI meets human creativity',
    cookies: 'Cookies',
    copyright: '© {year} MADFAM. All rights reserved.',
    sections: {
      platforms: 'Platforms',
      services: 'Solutions',
      ecosystem: 'Ecosystem',
      company: 'Company',
    },
    platforms: {
      enclii: 'Enclii',
      janua: 'Janua',
      selva: 'Selva',
      dhanam: 'Dhanam',
      forgeSight: 'Forge Sight',
      fortuna: 'Fortuna',
      rondelio: 'Rondelio',
      karafiel: 'Karafiel',
      tezca: 'Tezca',
      cotizaStudio: 'Cotiza Studio',
      yantra4d: 'Yantra4D',
      pravaraMes: 'Pravara-MES',
      penny: 'PENNY',
      avala: 'AVALA',
    },
    services: {
      makerNode: 'Primavera Maker Node',
      colabs: 'MADFAM Co-Labs',
      programs: 'Programs',
    },
    ecosystem: {
      membership: 'Membership',
      openSource: 'Open Source',
      impact: 'Impact',
    },
    company: {
      about: 'About Us',
      units: 'Solutions',
      careers: 'Careers',
      contact: 'Contact',
    },
    social: {
      linkedin: 'LinkedIn',
      twitter: 'Twitter',
      instagram: 'Instagram',
      facebook: 'Facebook',
      tiktok: 'TikTok',
      github: 'GitHub',
    },
  },
};

// Spanish messages for testing
const messagesEs = {
  common: {
    footer: {
      rights: 'Todos los derechos reservados',
      privacy: 'Privacidad',
      terms: 'Términos',
    },
  },
  leadForm: {
    fields: {
      name: 'Nombre',
      email: 'Correo electrónico',
      company: 'Empresa',
      phone: 'Teléfono',
      intent: '¿Qué te trae aquí?',
      timeline: 'Tiempo estimado',
      budget: 'Presupuesto o escala comercial esperada',
      region: 'Región',
      followUp: 'Seguimiento preferido',
      message: '¿Cómo podemos ayudarte?',
    },
    placeholders: {
      name: 'Tu nombre',
      email: 'tu@correo.com',
      company: 'Nombre de tu empresa',
      phone: '+52 55 1234 5678',
      region: 'CDMX, LATAM, EE.UU., remoto...',
      message: 'Cuéntanos sobre tu proyecto o necesidades...',
    },
    options: {
      select: 'Selecciona una opción',
    },
    intents: {
      platform: 'Quiero usar una plataforma MADFAM',
      'build-with-madfam': 'Quiero que MADFAM construya o lance algo con nosotros',
      'ecosystem-membership': 'Quiero unirme al ecosistema',
      'partner-invest': 'Quiero aliarme, integrar o invertir',
      support: 'Necesito soporte o tengo otra pregunta',
    },
    timelines: {
      now: 'Ahora / urgente',
      '30-days': 'En los próximos 30 días',
      quarter: 'Este trimestre',
      exploring: 'Explorando opciones',
    },
    budgets: {
      'not-sure': 'Aún no estoy seguro',
      'under-100k-mxn': 'Menos de MXN$100k',
      '100k-500k-mxn': 'MXN$100k-MXN$500k',
      '500k-plus-mxn': 'MXN$500k+',
    },
    followUp: {
      email: 'Email',
      whatsapp: 'WhatsApp',
      call: 'Llamada',
    },
    errors: {
      nameMin: 'El nombre es requerido',
      emailInvalid: 'Email inválido',
      intentRequired: 'Selecciona la ruta que mejor describe tu intención',
      timelineRequired: 'Selecciona un tiempo estimado',
      regionRequired: 'Indica tu región',
      followUpRequired: 'Selecciona un canal de seguimiento',
      messageMin: 'El mensaje es requerido',
    },
    messages: {
      success: 'Gracias por tu interés. Nos pondremos en contacto pronto.',
      error: 'Ocurrió un error. Por favor intenta de nuevo.',
    },
    requiredFields: 'Campos requeridos',
    submit: 'Enviar consulta',
  },
  footer: messages.footer,
};

interface WrapperProps {
  children: React.ReactNode;
  locale?: 'en' | 'es' | 'pt';
}

function AllTheProviders({ children, locale = 'es' }: WrapperProps) {
  const selectedMessages = locale === 'es' ? messagesEs : messages;

  return (
    <NextIntlClientProvider messages={selectedMessages} locale={locale}>
      {children}
    </NextIntlClientProvider>
  );
}

export function renderWithProviders(
  ui: React.ReactElement,
  {
    locale = 'es',
    ...renderOptions
  }: { locale?: 'en' | 'es' | 'pt' } & Parameters<typeof rtlRender>[1] = {}
): RenderResult {
  return rtlRender(ui, {
    wrapper: ({ children }) => <AllTheProviders locale={locale}>{children}</AllTheProviders>,
    ...renderOptions,
  });
}

export * from '@testing-library/react';
export { renderWithProviders as render };
