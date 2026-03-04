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

interface AssessmentResultsEmailProps {
  assessmentId: string;
  score: number;
  tier: string;
  strengths: string[];
  recommendations: string[];
  language?: 'es-MX' | 'en-US';
}

const baseUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000';

export const AssessmentResultsEmail: React.FC<AssessmentResultsEmailProps> = ({
  assessmentId,
  score,
  tier,
  strengths,
  recommendations,
  language = 'es-MX',
}) => {
  const content = {
    'es-MX': {
      preview: 'Resultados de tu evaluación de preparación para IA',
      title: 'Resultados de tu Evaluación de Preparación para IA',
      scoreTitle: 'Tu puntuación:',
      scoreOf: 'de 100',
      tierTitle: 'Nivel recomendado:',
      strengthsTitle: 'Fortalezas identificadas:',
      recommendationsTitle: 'Recomendaciones:',
      nextSteps: 'Próximos pasos recomendados:',
      cta: 'Agendar consulta personalizada',
      footer:
        'Nuestro equipo revisará estos resultados y te contactará para discutir cómo podemos ayudarte.',
      signature: 'Equipo MADFAM',
    },
    'en-US': {
      preview: 'Your AI Readiness Assessment Results',
      title: 'Your AI Readiness Assessment Results',
      scoreTitle: 'Your score:',
      scoreOf: 'out of 100',
      tierTitle: 'Recommended level:',
      strengthsTitle: 'Identified strengths:',
      recommendationsTitle: 'Recommendations:',
      nextSteps: 'Recommended next steps:',
      cta: 'Schedule personalized consultation',
      footer: 'Our team will review these results and contact you to discuss how we can help.',
      signature: 'MADFAM Team',
    },
  };

  const t = content[language];

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10B981'; // Green
    if (score >= 60) return '#F59E0B'; // Yellow
    if (score >= 40) return '#EF4444'; // Red
    return '#6B7280'; // Gray
  };

  const tierLabels = {
    'es-MX': {
      DESIGN_FABRICATION: 'Diseño y Fabricación',
      STRATEGY_ENABLEMENT: 'Estrategia y Habilitación',
      PLATFORM_PILOTS: 'Pilotos de Plataforma',
      STRATEGIC_PARTNERSHIPS: 'Alianzas Estratégicas',
    },
    'en-US': {
      DESIGN_FABRICATION: 'Design & Fabrication',
      STRATEGY_ENABLEMENT: 'Strategy & Enablement',
      PLATFORM_PILOTS: 'Platform Pilots',
      STRATEGIC_PARTNERSHIPS: 'Strategic Partnerships',
    },
  };

  return (
    <Html>
      <Head />
      <Preview>{t.preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Img src={`${baseUrl}/logo.png`} width="170" height="50" alt="MADFAM" style={logo} />
          <Heading style={h1}>{t.title}</Heading>

          <Section style={scoreContainer}>
            <div style={scoreBox}>
              <Text style={scoreLabel}>{t.scoreTitle}</Text>
              <Text style={{ ...scoreNumber, color: getScoreColor(score) }}>{score}</Text>
              <Text style={scoreLabel}>{t.scoreOf}</Text>
            </div>
          </Section>

          <Section style={tierContainer}>
            <Text style={tierLabel}>{t.tierTitle}</Text>
            <Text style={tierValue}>
              {tierLabels[language][tier as keyof (typeof tierLabels)[typeof language]] || tier}
            </Text>
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
            <Button style={button} href={`${baseUrl}/contact?ref=assessment&id=${assessmentId}`}>
              {t.cta}
            </Button>
          </Section>

          <Hr style={hr} />
          <Text style={text}>{t.footer}</Text>
          <Text style={signature}>{t.signature}</Text>

          <Hr style={hr} />
          <Text style={footer}>
            <Link href={`${baseUrl}`} style={link}>
              madfam.io
            </Link>
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

const tierContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
  padding: '20px',
  backgroundColor: '#f0f9ff',
  borderRadius: '8px',
};

const tierLabel = {
  color: '#6B7280',
  fontSize: '14px',
  fontWeight: '500',
  margin: '0 0 8px 0',
};

const tierValue = {
  color: '#0A0E27',
  fontSize: '20px',
  fontWeight: '600',
  margin: '0',
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
