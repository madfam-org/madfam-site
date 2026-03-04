import {
  ArrowUpRightIcon,
  ArrowLeftIcon,
  BeakerIcon,
  AcademicCapIcon,
  RocketLaunchIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: 'corporate.solutions.colabs',
  });

  return {
    title: `MADFAM Co-Labs - ${t('tagline')} | MADFAM`,
    description: t('description'),
    openGraph: {
      title: `MADFAM Co-Labs - ${t('tagline')}`,
      description: t('description'),
      type: 'website',
    },
  };
}

export default async function ColabsPage({ params }: Props) {
  const { locale } = await params;

  const t = await getTranslations({ locale, namespace: 'corporate.solutions' });
  const p = await getTranslations({ locale, namespace: 'corporate.solutions.colabs.page' });

  const capabilities = [
    {
      icon: <AcademicCapIcon className="w-6 h-6 text-blue-600" />,
      title: t('colabs.capabilities.0'),
      description: p('capabilityDescriptions.0'),
    },
    {
      icon: <BeakerIcon className="w-6 h-6 text-blue-600" />,
      title: t('colabs.capabilities.1'),
      description: p('capabilityDescriptions.1'),
    },
    {
      icon: <RocketLaunchIcon className="w-6 h-6 text-blue-600" />,
      title: t('colabs.capabilities.2'),
      description: p('capabilityDescriptions.2'),
    },
    {
      icon: <UsersIcon className="w-6 h-6 text-blue-600" />,
      title: t('colabs.capabilities.3'),
      description: p('capabilityDescriptions.3'),
    },
  ];

  const programs = [
    {
      id: 'madlab',
      name: 'MADLAB',
      partner: 'La Ciencia del Juego',
      partnerUrl: 'https://lacienciadeljuego.com/',
      description:
        'Laboratorio de innovación educativa donde el aprendizaje se convierte en juego y la ciencia en aventura',
      features: [
        'Robótica educativa',
        'Programación creativa',
        'Diseño 3D y fabricación digital',
        'Experimentos científicos interactivos',
      ],
      status: 'active',
    },
    {
      id: 'workshops',
      name: 'Tech Workshops',
      description:
        'Talleres especializados en tecnologías emergentes para profesionales y estudiantes',
      features: [
        'Inteligencia Artificial',
        'Desarrollo Web Moderno',
        'Cloud Computing',
        'Blockchain y Web3',
      ],
      status: 'active',
    },
    {
      id: 'bootcamps',
      name: 'Innovation Bootcamps',
      description: 'Programas intensivos de formación para acelerar carreras en tecnología',
      features: ['Full Stack Development', 'Data Science', 'UX/UI Design', 'DevOps'],
      status: 'active',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Navigation */}
      <div className="container mx-auto px-4 py-4">
        <Link
          href={`/${locale}/solutions`}
          className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          {t('viewAll')}
        </Link>
      </div>

      {/* Hero Section */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
              <h1 className="text-5xl lg:text-6xl font-bold text-neutral-900">MADFAM Co-Labs</h1>
              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full font-medium">
                {p('badge')}
              </span>
            </div>

            <p className="text-2xl text-blue-600 font-medium mb-6">{t('colabs.tagline')}</p>

            <p className="text-xl text-neutral-600 leading-relaxed mb-8">
              {t('colabs.description')}
            </p>

            <div className="flex flex-wrap gap-4">
              <Link
                href={`/${locale}/contact`}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                {p('startCollaboration')}
              </Link>

              <a
                href="#programs"
                className="inline-flex items-center px-6 py-3 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 transition-colors font-medium"
              >
                {p('viewPrograms')}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-neutral-900 mb-12 text-center">
              {p('capabilitiesTitle')}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {capabilities.map((capability, index) => (
                <div
                  key={index}
                  className="flex gap-4 p-6 bg-blue-50 rounded-xl border border-blue-100"
                >
                  <div className="flex-shrink-0">{capability.icon}</div>
                  <div>
                    <h3 className="text-lg font-bold text-neutral-900 mb-2">{capability.title}</h3>
                    <p className="text-sm text-neutral-600">{capability.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Programs Section */}
      <section id="programs" className="py-16 bg-gradient-to-b from-white to-blue-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-neutral-900 mb-4 text-center">
              {p('programsTitle')}
            </h2>
            <p className="text-xl text-neutral-600 mb-12 text-center max-w-3xl mx-auto">
              {p('programsSubtitle')}
            </p>

            <div className="space-y-8">
              {programs.map(program => (
                <div
                  key={program.id}
                  id={program.id}
                  className="p-8 bg-white rounded-2xl border border-blue-200 hover:border-blue-300 transition-colors"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <h3 className="text-2xl font-bold text-neutral-900">{program.name}</h3>
                        {program.status === 'active' && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                            {p('active')}
                          </span>
                        )}
                      </div>

                      {program.partner && (
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-sm text-neutral-600">
                            {p('inCollaborationWith')}
                          </span>
                          <Link
                            href={program.partnerUrl!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium"
                          >
                            {program.partner}
                            <ArrowUpRightIcon className="w-4 h-4" />
                          </Link>
                        </div>
                      )}

                      <p className="text-neutral-600 mb-4">{program.description}</p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {program.features.map((feature, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                            <span className="text-sm text-neutral-700">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {program.id === 'madlab' && program.partnerUrl && (
                      <div className="flex-shrink-0">
                        <Link
                          href={program.partnerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium"
                        >
                          {p('learnMore')}
                          <ArrowUpRightIcon className="w-4 h-4" />
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Partnership Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-neutral-900 mb-4">{p('partnershipsTitle')}</h2>
            <p className="text-xl text-neutral-600 mb-12">{p('partnershipsSubtitle')}</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
                <h3 className="text-lg font-bold text-neutral-900 mb-2">
                  {p('partners.educational.name')}
                </h3>
                <p className="text-sm text-neutral-600">{p('partners.educational.description')}</p>
              </div>

              <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
                <h3 className="text-lg font-bold text-neutral-900 mb-2">
                  {p('partners.tech.name')}
                </h3>
                <p className="text-sm text-neutral-600">{p('partners.tech.description')}</p>
              </div>

              <div className="p-6 bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl">
                <h3 className="text-lg font-bold text-neutral-900 mb-2">
                  {p('partners.social.name')}
                </h3>
                <p className="text-sm text-neutral-600">{p('partners.social.description')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">{p('ctaTitle')}</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">{p('ctaSubtitle')}</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href={`/${locale}/contact`}
              className="inline-flex items-center px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
            >
              {p('startCollaboration')}
            </Link>
            <Link
              href="https://lacienciadeljuego.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors font-medium"
            >
              {p('visitPartner')}
              <ArrowUpRightIcon className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
