import { getLocalizedContent, type Locale } from '@madfam/i18n';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Container, Heading, Button } from '@/components/ui';

interface TeamMember {
  name: string;
  role: {
    es: string;
    en: string;
    pt: string;
  };
  bio: {
    es: string;
    en: string;
    pt: string;
  };
  expertise: {
    es: string[];
    en: string[];
    pt: string[];
  };
  image: string;
}

interface Milestone {
  year: string;
  event: {
    es: string;
    en: string;
    pt: string;
  };
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations('about');
  const corporateT = await getTranslations('corporate');
  const currentLocale = locale as Locale;

  const team: TeamMember[] = [
    {
      name: 'Aldo Ruiz Luna',
      role: {
        es: 'CEO & Fundador',
        en: 'CEO & Founder',
        pt: 'CEO & Fundador',
      },
      bio: {
        es: 'Visionario tecnológico con más de 15 años transformando empresas con IA y creatividad.',
        en: 'Technology visionary with over 15 years transforming companies with AI and creativity.',
        pt: 'Visionário tecnológico com mais de 15 anos transformando empresas com IA e criatividade.',
      },
      expertise: {
        es: ['Estrategia IA', 'Innovación', 'Liderazgo'],
        en: ['AI Strategy', 'Innovation', 'Leadership'],
        pt: ['Estratégia IA', 'Inovação', 'Liderança'],
      },
      image: '/team/aldo.jpg',
    },
    {
      name: 'Daniela Martínez',
      role: {
        es: 'Directora Creativa',
        en: 'Creative Director',
        pt: 'Diretora Criativa',
      },
      bio: {
        es: 'Experta en diseño 3D y experiencias digitales que conectan marcas con audiencias.',
        en: 'Expert in 3D design and digital experiences that connect brands with audiences.',
        pt: 'Especialista em design 3D e experiências digitais que conectam marcas com audiências.',
      },
      expertise: {
        es: ['Diseño 3D', 'UX/UI', 'Branding'],
        en: ['3D Design', 'UX/UI', 'Branding'],
        pt: ['Design 3D', 'UX/UI', 'Branding'],
      },
      image: '/team/daniela.jpg',
    },
    {
      name: 'Carlos Mendoza',
      role: {
        es: 'CTO',
        en: 'CTO',
        pt: 'CTO',
      },
      bio: {
        es: 'Arquitecto de soluciones que lidera la implementación de plataformas empresariales.',
        en: 'Solutions architect leading enterprise platform implementations.',
        pt: 'Arquiteto de soluções que lidera a implementação de plataformas empresariais.',
      },
      expertise: {
        es: ['Arquitectura', 'DevOps', 'Cloud'],
        en: ['Architecture', 'DevOps', 'Cloud'],
        pt: ['Arquitetura', 'DevOps', 'Cloud'],
      },
      image: '/team/carlos.jpg',
    },
    {
      name: 'Ana López',
      role: {
        es: 'Directora de IA',
        en: 'AI Director',
        pt: 'Diretora de IA',
      },
      bio: {
        es: 'Pionera en automatización inteligente y machine learning aplicado a negocios.',
        en: 'Pioneer in intelligent automation and machine learning applied to business.',
        pt: 'Pioneira em automação inteligente e machine learning aplicado a negócios.',
      },
      expertise: {
        es: ['Machine Learning', 'Automatización', 'Data Science'],
        en: ['Machine Learning', 'Automation', 'Data Science'],
        pt: ['Machine Learning', 'Automação', 'Data Science'],
      },
      image: '/team/ana.jpg',
    },
  ];

  const pillars = [
    {
      icon: '♾️',
      key: 'circularity',
      title: corporateT('pillars.circularity.title'),
      description: corporateT('pillars.circularity.body'),
    },
    {
      icon: '📍',
      key: 'traceability',
      title: corporateT('pillars.traceability.title'),
      description: corporateT('pillars.traceability.body'),
    },
    {
      icon: '🔐',
      key: 'ethicalData',
      title: corporateT('pillars.ethicalData.title'),
      description: corporateT('pillars.ethicalData.body'),
    },
    {
      icon: '🌎',
      key: 'latamTalent',
      title: corporateT('pillars.latamTalent.title'),
      description: corporateT('pillars.latamTalent.body'),
    },
  ];

  const milestones: Milestone[] = [
    {
      year: '2019',
      event: {
        es: 'Fundación de MADFAM',
        en: 'MADFAM Founded',
        pt: 'Fundação da MADFAM',
      },
    },
    {
      year: '2020',
      event: {
        es: 'Lanzamiento de primeras plataformas de IA',
        en: 'Launch of first AI platforms',
        pt: 'Lançamento das primeiras plataformas de IA',
      },
    },
    {
      year: '2021',
      event: {
        es: '100+ proyectos completados',
        en: '100+ projects completed',
        pt: '100+ projetos concluídos',
      },
    },
    {
      year: '2022',
      event: {
        es: 'Expansión internacional',
        en: 'International expansion',
        pt: 'Expansão internacional',
      },
    },
    {
      year: '2023',
      event: {
        es: 'Lanzamiento de Penny',
        en: 'Penny launch',
        pt: 'Lançamento do Penny',
      },
    },
    {
      year: '2024',
      event: {
        es: '50+ empresas transformadas',
        en: '50+ companies transformed',
        pt: '50+ empresas transformadas',
      },
    },
  ];

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-20 pb-16 bg-gradient-to-br from-obsidian to-obsidian/90 text-white overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 right-20 w-96 h-96 bg-lavender rounded-full filter blur-3xl animate-float" />
          <div className="absolute bottom-10 left-10 w-72 h-72 bg-sun rounded-full filter blur-3xl animate-float animation-delay-400" />
        </div>

        <Container className="relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <Heading level={1} className="text-white mb-6 animate-fade-up">
              {t('title').split('MADFAM')[0]}
              <span className="gradient-text">MADFAM</span>
              {t('title').split('MADFAM')[1]}
            </Heading>
            <p className="text-xl text-white/90 mb-8 animate-fade-up animation-delay-200">
              {t('subtitle')}
            </p>
            <div className="flex flex-wrap gap-4 justify-center animate-fade-up animation-delay-400">
              <Button variant="secondary" size="lg">
                {t('cta.seeWork')}
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-white text-white hover:bg-white hover:text-obsidian"
              >
                {t('cta.joinTeam')}
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* Mission & Vision */}
      <section className="section">
        <Container>
          <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            <div className="text-center md:text-left">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-lavender/10 mb-6">
                <span className="text-3xl">🎯</span>
              </div>
              <Heading level={3} className="mb-4">
                {t('mission.title')}
              </Heading>
              <p className="text-lg text-obsidian/70">{corporateT('mission')}</p>
            </div>
            <div className="text-center md:text-left">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-sun/10 mb-6">
                <span className="text-3xl">👁️</span>
              </div>
              <Heading level={3} className="mb-4">
                {t('vision.title')}
              </Heading>
              <p className="text-lg text-obsidian/70">{corporateT('vision')}</p>
            </div>
          </div>
        </Container>
      </section>

      {/* Pillars */}
      <section className="section bg-pearl">
        <Container>
          <div className="text-center mb-12">
            <Heading level={2} className="mb-4">
              {t('values.title')}
            </Heading>
            <p className="text-lg text-obsidian/70 max-w-3xl mx-auto">{t('values.subtitle')}</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {pillars.map(pillar => (
              <div
                key={pillar.key}
                className="text-center p-6 rounded-2xl bg-white shadow-sm hover:shadow-lg transition-shadow"
              >
                <div className="text-5xl mb-4">{pillar.icon}</div>
                <h3 className="font-heading text-lg font-semibold mb-3">{pillar.title}</h3>
                <p className="text-obsidian/70">{pillar.description}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Team */}
      <section className="section">
        <Container>
          <div className="text-center mb-12">
            <Heading level={2} className="mb-4">
              {t('team.title')}
            </Heading>
            <p className="text-lg text-obsidian/70 max-w-3xl mx-auto">{t('team.subtitle')}</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <div
                key={index}
                className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 p-1"
              >
                <div className="relative bg-white rounded-[14px] p-6 h-full">
                  {/* Placeholder for team member photo */}
                  <div className="relative w-32 h-32 mx-auto mb-6 rounded-full overflow-hidden bg-gradient-to-br from-lavender/20 to-sun/20">
                    <div className="absolute inset-0 flex items-center justify-center text-4xl opacity-50">
                      👤
                    </div>
                  </div>

                  <h3 className="font-heading text-xl font-semibold text-center mb-1">
                    {member.name}
                  </h3>
                  <p className="text-lavender text-center mb-4">
                    {getLocalizedContent(member.role, currentLocale)}
                  </p>
                  <p className="text-sm text-obsidian/70 text-center mb-4">
                    {getLocalizedContent(member.bio, currentLocale)}
                  </p>

                  <div className="flex flex-wrap gap-2 justify-center">
                    {getLocalizedContent(member.expertise, currentLocale).map((skill, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-3 py-1 rounded-full bg-obsidian/5 text-obsidian/70"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Timeline */}
      <section className="section bg-gradient-to-br from-obsidian/5 to-lavender/5">
        <Container>
          <div className="text-center mb-12">
            <Heading level={2} className="mb-4">
              {t('history.title')}
            </Heading>
            <p className="text-lg text-obsidian/70 max-w-3xl mx-auto">{t('history.subtitle')}</p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-1/2 transform -translate-x-1/2 w-0.5 h-full bg-gradient-to-b from-lavender to-sun" />

              {/* Timeline items */}
              {milestones.map((milestone, index) => (
                <div
                  key={index}
                  className={`relative flex items-center mb-12 ${
                    index % 2 === 0 ? 'justify-start' : 'justify-end'
                  }`}
                >
                  <div
                    className={`w-5/12 ${index % 2 === 0 ? 'text-right pr-8' : 'text-left pl-8'}`}
                  >
                    <div className="inline-block px-4 py-2 rounded-full bg-gradient-to-r from-lavender to-sun text-white font-semibold mb-2">
                      {milestone.year}
                    </div>
                    <h3 className="font-heading text-lg font-semibold">
                      {getLocalizedContent(milestone.event, currentLocale)}
                    </h3>
                  </div>

                  {/* Timeline dot */}
                  <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 rounded-full bg-white border-4 border-lavender" />
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="section">
        <Container>
          <div className="bg-gradient-to-br from-lavender to-sun rounded-3xl p-12 text-center text-white">
            <Heading level={2} className="text-white mb-4">
              {t('cta.title')}
            </Heading>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">{t('cta.subtitle')}</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/contact">
                <Button variant="secondary" size="lg">
                  {t('cta.scheduleCall')}
                </Button>
              </Link>
              <Button
                variant="outline"
                size="lg"
                className="border-white text-white hover:bg-white hover:text-lavender"
              >
                {t('cta.viewOpportunities')}
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
