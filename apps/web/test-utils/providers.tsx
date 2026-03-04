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
  forms: {
    leadForm: {
      title: 'Contact Us',
      fields: {
        name: 'Name',
        email: 'Email',
        company: 'Company',
        phone: 'Phone',
        message: 'Message',
      },
      placeholders: {
        name: 'Your name',
        email: 'your@email.com',
        company: 'Your company',
        phone: 'Your phone number',
        message: 'How can we help you?',
      },
      validation: {
        nameRequired: 'Name is required',
        emailRequired: 'Email is required',
        emailInvalid: 'Invalid email',
        messageRequired: 'Message is required',
      },
      submit: 'Send Inquiry',
      submitting: 'Sending...',
      success: 'Thank you for your interest. We will contact you soon.',
      error: 'An error occurred. Please try again.',
    },
  },
  footer: {
    tagline: 'Where AI meets human creativity',
    cookies: 'Cookies',
    sections: {
      programs: 'Programs',
      products: 'Products',
      company: 'Company',
      resources: 'Resources',
    },
    programs: {
      designFabrication: 'Design & Fabrication',
      strategyEnablement: 'Strategy & Enablement',
      platformPilots: 'Platform Pilots',
      strategicPartnerships: 'Strategic Partnerships',
    },
    company: {
      about: 'About Us',
      units: 'Business Units',
      caseStudies: 'Case Studies',
      careers: 'Careers',
    },
    resources: {
      assessment: 'AI Assessment',
      calculator: 'ROI Calculator',
      guides: 'Guides',
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
  forms: {
    leadForm: {
      title: 'Contáctanos',
      fields: {
        name: 'Nombre',
        email: 'Correo electrónico',
        company: 'Empresa',
        phone: 'Teléfono',
        message: 'Mensaje',
      },
      placeholders: {
        name: 'Tu nombre',
        email: 'tu@correo.com',
        company: 'Tu empresa',
        phone: 'Tu número de teléfono',
        message: '¿Cómo podemos ayudarte?',
      },
      validation: {
        nameRequired: 'El nombre es requerido',
        emailRequired: 'El email es requerido',
        emailInvalid: 'Email inválido',
        messageRequired: 'El mensaje es requerido',
      },
      submit: 'Enviar consulta',
      submitting: 'Enviando...',
      success: 'Gracias por tu interés. Nos pondremos en contacto pronto.',
      error: 'Ocurrió un error. Por favor intenta de nuevo.',
    },
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
