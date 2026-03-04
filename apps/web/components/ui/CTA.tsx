import Link from 'next/link';
import { cn } from './utils';
import { Container } from './Container';
import { Button } from './Button';

interface CTAProps {
  title: string;
  description?: string;
  primaryButton?: {
    text: string;
    href?: string;
    onClick?: () => void;
  };
  secondaryButton?: {
    text: string;
    href?: string;
    onClick?: () => void;
  };
  cta?: {
    text: string;
    href?: string;
    variant?: string;
    onClick?: () => void;
  };
  variant?: 'default' | 'gradient' | 'dark' | 'centered';
  background?: 'default' | 'gradient' | 'dark';
  className?: string;
}

export function CTA({
  title,
  description,
  primaryButton,
  secondaryButton,
  cta,
  variant = 'gradient',
  background: _background,
  className,
}: CTAProps) {
  const variantStyles = {
    default: 'bg-gray-100',
    gradient: 'bg-gradient-to-r from-blue-600 to-purple-600 text-white',
    dark: 'bg-gray-900 text-white',
    centered: 'bg-gradient-to-r from-blue-600 to-purple-600 text-white',
  };

  return (
    <section className={cn('py-16', variantStyles[variant], className)}>
      <Container>
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{title}</h2>
          {description && (
            <p
              className={cn(
                'text-lg mb-8',
                variant === 'default' ? 'text-gray-600' : 'text-white/90'
              )}
            >
              {description}
            </p>
          )}
          <div className="flex flex-wrap gap-4 justify-center">
            {cta &&
              (cta.href ? (
                <Link href={cta.href}>
                  <Button variant={cta.variant === 'primary' ? 'secondary' : 'creative'} size="lg">
                    {cta.text}
                  </Button>
                </Link>
              ) : (
                <Button
                  variant={cta.variant === 'primary' ? 'secondary' : 'creative'}
                  size="lg"
                  onClick={cta.onClick}
                >
                  {cta.text}
                </Button>
              ))}
            {primaryButton &&
              (primaryButton.href ? (
                <Link href={primaryButton.href}>
                  <Button
                    variant={
                      variant === 'gradient' || variant === 'centered' ? 'secondary' : 'creative'
                    }
                    size="lg"
                  >
                    {primaryButton.text}
                  </Button>
                </Link>
              ) : (
                <Button
                  variant={
                    variant === 'gradient' || variant === 'centered' ? 'secondary' : 'creative'
                  }
                  size="lg"
                  onClick={primaryButton.onClick}
                >
                  {primaryButton.text}
                </Button>
              ))}
            {secondaryButton &&
              (secondaryButton.href ? (
                <Link href={secondaryButton.href}>
                  <Button
                    variant="outline"
                    size="lg"
                    className={
                      variant !== 'default' ? 'border-white text-white hover:bg-white/10' : ''
                    }
                  >
                    {secondaryButton.text}
                  </Button>
                </Link>
              ) : (
                <Button
                  variant="outline"
                  size="lg"
                  className={
                    variant !== 'default' ? 'border-white text-white hover:bg-white/10' : ''
                  }
                  onClick={secondaryButton.onClick}
                >
                  {secondaryButton.text}
                </Button>
              ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
