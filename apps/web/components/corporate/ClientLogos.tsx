'use client';

import { useTranslations } from 'next-intl';
import { Container } from '@/components/ui';

// Products in the MADFAM ecosystem — real, live products
const ecosystemProducts = [
  {
    name: 'Enclii',
    description: 'Sovereign Cloud PaaS',
    icon: '☁️',
  },
  {
    name: 'Janua',
    description: 'Identity & Auth Platform',
    icon: '🔐',
  },
  {
    name: 'Forge Sight',
    description: 'Pricing Intelligence',
    icon: '🏭',
  },
  {
    name: 'Dhanam',
    description: 'Financial Wellness',
    icon: '💰',
  },
  {
    name: 'Cotiza Studio',
    description: 'Quoting & Estimation',
    icon: '📊',
  },
];

interface ClientLogosProps {
  variant?: 'default' | 'compact' | 'with-metrics';
}

export function ClientLogos({ variant = 'default' }: ClientLogosProps) {
  const t = useTranslations('corporate');

  if (variant === 'compact') {
    return (
      <section className="py-8 bg-neutral-50 border-y border-neutral-200">
        <Container>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            <p className="text-sm text-neutral-500 font-medium">
              {t('trustedBy.label', { defaultValue: 'Powered by the MADFAM ecosystem' })}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
              {ecosystemProducts.slice(0, 4).map(product => (
                <EcosystemItem key={product.name} product={product} />
              ))}
            </div>
          </div>
        </Container>
      </section>
    );
  }

  if (variant === 'with-metrics') {
    return (
      <section className="py-16 bg-white">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-neutral-900 mb-2">
              {t('trustedBy.title', { defaultValue: 'The MADFAM Ecosystem' })}
            </h2>
            <p className="text-neutral-600">
              {t('trustedBy.subtitle', {
                defaultValue: 'Purpose-built platforms for Latin American businesses',
              })}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 items-center">
            {ecosystemProducts.map(product => (
              <EcosystemItem key={product.name} product={product} size="large" />
            ))}
          </div>
        </Container>
      </section>
    );
  }

  // Default variant
  return (
    <section className="py-12 bg-neutral-50 border-y border-neutral-200">
      <Container>
        <p className="text-center text-sm text-neutral-600 mb-8 font-medium">
          {t('trustedBy.label', {
            defaultValue: 'Powered by the MADFAM ecosystem',
          })}
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 items-center max-w-5xl mx-auto">
          {ecosystemProducts.map(product => (
            <EcosystemItem key={product.name} product={product} />
          ))}
        </div>
      </Container>
    </section>
  );
}

interface EcosystemItemProps {
  product: (typeof ecosystemProducts)[0];
  size?: 'default' | 'large';
}

function EcosystemItem({ product, size = 'default' }: EcosystemItemProps) {
  return (
    <div
      className={`${
        size === 'large' ? 'h-24' : 'h-20'
      } bg-white rounded-lg flex items-center justify-center border border-neutral-200 hover:border-neutral-300 transition-colors`}
    >
      <div className="text-center">
        <span className="text-2xl">{product.icon}</span>
        <span className="block text-neutral-700 font-medium text-sm">{product.name}</span>
        <span className="block text-neutral-400 text-xs">{product.description}</span>
      </div>
    </div>
  );
}
