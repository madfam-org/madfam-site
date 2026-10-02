import React from 'react';
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';

import {
  DISCOVERY_CALL_URL,
  ENTITY_LINE,
  emailLanguage,
  localizedSiteUrl,
  logoUrl,
  siteUrl,
} from '../brand';

interface WelcomeEmailProps {
  name: string;
  /** Any language tag (`es`, `es-MX`, `en`, `pt-BR`, …); normalised to es/en/pt. */
  language?: string;
  /**
   * Accepted for backwards compatibility with queued payloads and ignored: the
   * consultancy-era service tiers it used to name are retired.
   */
  tier?: string;
}

// Copy in the site's voice (copy deck R14: es-MX «tú»). No response-time
// promise (R47) and no consultancy framing.
const CONTENT = {
  es: {
    preview: 'Recibimos tu mensaje — MADFAM',
    heading: 'Gracias por escribirnos',
    greeting: (name: string) => `Hola, ${name}:`,
    intro: 'Recibimos tu mensaje. Una persona del equipo lo leerá y te responderá por correo.',
    meanwhile:
      'Mientras tanto, puedes conocer nuestras plataformas o agendar una llamada de descubrimiento.',
    cta: 'Ver las plataformas',
    call: 'Agendar una llamada',
    signature: 'Equipo MADFAM',
  },
  en: {
    preview: 'We received your message — MADFAM',
    heading: 'Thanks for writing to us',
    greeting: (name: string) => `Hi ${name},`,
    intro: 'We received your message. Someone on the team will read it and reply by email.',
    meanwhile: 'In the meantime, you can explore our platforms or book a discovery call.',
    cta: 'Explore the platforms',
    call: 'Book a call',
    signature: 'The MADFAM team',
  },
  pt: {
    preview: 'Recebemos sua mensagem — MADFAM',
    heading: 'Obrigado por nos escrever',
    greeting: (name: string) => `Olá, ${name}:`,
    intro: 'Recebemos sua mensagem. Uma pessoa da equipe vai lê-la e responder por e-mail.',
    meanwhile:
      'Enquanto isso, você pode conhecer nossas plataformas ou agendar uma chamada de descoberta.',
    cta: 'Ver as plataformas',
    call: 'Agendar uma chamada',
    signature: 'Equipe MADFAM',
  },
} as const;

export const WelcomeEmail: React.FC<WelcomeEmailProps> = ({ name, language }) => {
  const lang = emailLanguage(language);
  const t = CONTENT[lang];

  return (
    <Html lang={lang}>
      <Head />
      <Preview>{t.preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Img src={logoUrl()} width="56" height="57" alt="MADFAM" style={logo} />
          <Heading style={h1}>{t.heading}</Heading>
          <Text style={text}>{t.greeting(name)}</Text>
          <Text style={text}>{t.intro}</Text>
          <Text style={text}>{t.meanwhile}</Text>

          <Section style={buttonContainer}>
            <Button style={button} href={localizedSiteUrl(lang, '/platforms')}>
              {t.cta}
            </Button>
          </Section>
          <Text style={centered}>
            <Link href={DISCOVERY_CALL_URL} style={link}>
              {t.call}
            </Link>
          </Text>

          <Text style={signature}>{t.signature}</Text>

          <Hr style={hr} />
          <Text style={footer}>
            <Link href={siteUrl()} style={link}>
              madfam.io
            </Link>
            <br />
            {ENTITY_LINE}
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

const main = {
  backgroundColor: '#ffffff',
  fontFamily: 'Inter, system-ui, sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '560px',
};

const logo = {
  margin: '0 auto 20px',
};

const h1 = {
  color: '#0A0E27',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '40px',
  margin: '0 0 20px',
};

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#0A0E27',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 24px',
  margin: '0 auto',
  maxWidth: '200px',
};

const centered = {
  ...text,
  textAlign: 'center' as const,
};

const hr = {
  borderColor: '#e5e7eb',
  margin: '32px 0',
};

const signature = {
  color: '#6B7280',
  fontSize: '16px',
  fontWeight: '600',
  margin: '16px 0',
};

const footer = {
  color: '#6B7280',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '16px 0',
  textAlign: 'center' as const,
};

const link = {
  color: '#9B59B6',
  textDecoration: 'underline',
};
