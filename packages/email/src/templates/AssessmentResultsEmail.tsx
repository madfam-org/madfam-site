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

import { ENTITY_LINE, emailLanguage, localizedSiteUrl, logoUrl, siteUrl } from '../brand';

interface AssessmentResultsEmailProps {
  assessmentId: string;
  score: number;
  /**
   * Accepted for backwards compatibility with queued payloads and not
   * rendered: the consultancy-era tier labels it mapped to are retired.
   */
  tier?: string;
  strengths: string[];
  recommendations: string[];
  /** Any language tag (`es`, `es-MX`, `en`, `pt-BR`, …); normalised to es/en/pt. */
  language?: string;
}

const CONTENT = {
  es: {
    preview: 'Resultados de tu evaluación — MADFAM',
    title: 'Resultados de tu evaluación',
    scoreTitle: 'Tu puntuación:',
    scoreOf: 'de 100',
    strengthsTitle: 'Fortalezas identificadas:',
    recommendationsTitle: 'Recomendaciones:',
    cta: 'Escríbenos',
    footer:
      'Estos resultados son orientativos y se basan solo en tus respuestas. Si quieres conversarlos, escríbenos.',
    signature: 'Equipo MADFAM',
  },
  en: {
    preview: 'Your assessment results — MADFAM',
    title: 'Your assessment results',
    scoreTitle: 'Your score:',
    scoreOf: 'out of 100',
    strengthsTitle: 'Identified strengths:',
    recommendationsTitle: 'Recommendations:',
    cta: 'Write to us',
    footer:
      'These results are indicative and based only on your answers. If you want to talk them through, write to us.',
    signature: 'The MADFAM team',
  },
  pt: {
    preview: 'Resultados da sua avaliação — MADFAM',
    title: 'Resultados da sua avaliação',
    scoreTitle: 'Sua pontuação:',
    scoreOf: 'de 100',
    strengthsTitle: 'Pontos fortes identificados:',
    recommendationsTitle: 'Recomendações:',
    cta: 'Escreva para nós',
    footer:
      'Estes resultados são indicativos e se baseiam apenas nas suas respostas. Se quiser conversar sobre eles, escreva para nós.',
    signature: 'Equipe MADFAM',
  },
} as const;

export const AssessmentResultsEmail: React.FC<AssessmentResultsEmailProps> = ({
  assessmentId,
  score,
  strengths,
  recommendations,
  language,
}) => {
  const lang = emailLanguage(language);
  const t = CONTENT[lang];

  const getScoreColor = (value: number) => {
    if (value >= 80) return '#10B981'; // Green
    if (value >= 60) return '#F59E0B'; // Yellow
    if (value >= 40) return '#EF4444'; // Red
    return '#6B7280'; // Gray
  };

  const contactUrl = `${localizedSiteUrl(lang, '/contact')}?ref=assessment&id=${encodeURIComponent(assessmentId)}`;

  return (
    <Html lang={lang}>
      <Head />
      <Preview>{t.preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Img src={logoUrl()} width="56" height="57" alt="MADFAM" style={logo} />
          <Heading style={h1}>{t.title}</Heading>

          <Section style={scoreContainer}>
            <div style={scoreBox}>
              <Text style={scoreLabel}>{t.scoreTitle}</Text>
              <Text style={{ ...scoreNumber, color: getScoreColor(score) }}>{score}</Text>
              <Text style={scoreLabel}>{t.scoreOf}</Text>
            </div>
          </Section>

          {strengths.length > 0 && (
            <Section style={section}>
              <Heading style={h2}>{t.strengthsTitle}</Heading>
              {strengths.map((strength, index) => (
                <Text key={index} style={listItem}>
                  • {strength}
                </Text>
              ))}
            </Section>
          )}

          {recommendations.length > 0 && (
            <Section style={section}>
              <Heading style={h2}>{t.recommendationsTitle}</Heading>
              {recommendations.map((recommendation, index) => (
                <Text key={index} style={listItem}>
                  • {recommendation}
                </Text>
              ))}
            </Section>
          )}

          <Section style={buttonContainer}>
            <Button style={button} href={contactUrl}>
              {t.cta}
            </Button>
          </Section>

          <Hr style={hr} />
          <Text style={text}>{t.footer}</Text>
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

const h2 = {
  color: '#0A0E27',
  fontSize: '20px',
  fontWeight: '600',
  lineHeight: '28px',
  margin: '30px 0 15px',
};

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
};

const scoreContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const scoreBox = {
  display: 'inline-block',
  padding: '24px',
  backgroundColor: '#f9fafb',
  borderRadius: '12px',
  textAlign: 'center' as const,
};

const scoreLabel = {
  color: '#6B7280',
  fontSize: '14px',
  fontWeight: '500',
  margin: '0',
};

const scoreNumber = {
  fontSize: '48px',
  fontWeight: '700',
  lineHeight: '1',
  margin: '8px 0',
};

const section = {
  margin: '32px 0',
};

const listItem = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '8px 0',
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
  maxWidth: '280px',
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
