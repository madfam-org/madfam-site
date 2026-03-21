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
    },
    placeholders: {
      name: 'Your name',
      email: 'your@email.com',
    },
    errors: {
      nameMin: 'Name is required',
      emailInvalid: 'Invalid email',
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
      dhanam: 'Dhanam',
      forgeSight: 'Forge Sight',
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
    },
    placeholders: {
      name: 'Tu nombre',
      email: 'tu@correo.com',
    },
    errors: {
      nameMin: 'El nombre es requerido',
      emailInvalid: 'Email inválido',
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
