import Link from 'next/link';
import { cn } from './utils';
import { Container } from './Container';
import { Heading } from './Heading';
import { Button } from './Button';

interface HeroCta {
  text: string;
  href?: string;
  onClick?: () => void;
  variant?: string;
}

interface HeroProps {
  title: string;
  subtitle?: string;
  description?: string;
  primaryCta?: HeroCta;
  secondaryCta?: HeroCta;
  cta?: {
    primary?: HeroCta;
    secondary?: HeroCta;
  };
  variant?: 'default' | 'product' | 'landing' | 'minimal' | 'home';
  backgroundVariant?: 'gradient' | 'image' | 'pattern' | 'solid';
  background?: string;
  className?: string;
  children?: React.ReactNode;
}

export function Hero({
  title,
  subtitle,
  description,
  primaryCta,
  secondaryCta,
  cta,
  variant: _variant = 'default',
  backgroundVariant = 'gradient',
  background,
  className,
  children,
}: HeroProps) {
  const bgStyles = {
    gradient: 'bg-gradient-to-br from-blue-50 to-purple-50',
    image: 'bg-cover bg-center',
    pattern: 'bg-gray-50',
    solid: 'bg-white',
  };

  // Merge cta object with individual props
  const primary = cta?.primary || primaryCta;
  const secondary = cta?.secondary || secondaryCta;

  const renderButton = (ctaConfig: HeroCta, isPrimary: boolean) => {
    const buttonVariant = isPrimary ? 'creative' : 'outline';

    if (ctaConfig.href) {
      return (
        <Link href={ctaConfig.href}>
          <Button variant={buttonVariant as 'creative' | 'outline'} size="lg">
            {ctaConfig.text}
          </Button>
        </Link>
      );
    }

    return (
      <Button
        variant={buttonVariant as 'creative' | 'outline'}
        size="lg"
        onClick={ctaConfig.onClick}
      >
        {ctaConfig.text}
      </Button>
    );
  };

  return (
    <section className={cn('py-20 md:py-32', background || bgStyles[backgroundVariant], className)}>
      <Container>
        <div className="max-w-4xl mx-auto text-center">
          {subtitle && (
            <p className="text-sm font-medium text-blue-600 mb-4 uppercase tracking-wide">
              {subtitle}
            </p>
          )}
          <Heading level={1} className="mb-6">
            {title}
          </Heading>
          {description && (
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">{description}</p>
          )}
          {(primary || secondary) && (
            <div className="flex flex-wrap gap-4 justify-center">
              {primary && renderButton(primary, true)}
              {secondary && renderButton(secondary, false)}
            </div>
          )}
          {children}
        </div>
      </Container>
    </section>
  );
}
