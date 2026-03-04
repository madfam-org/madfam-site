import Link from 'next/link';
import { cn } from './utils';
import { Card, CardContent } from './Card';
import { Button } from './Button';

type FeatureItem = string | { icon?: React.ReactNode; text: string };
type BadgeItem = string | { text: string; variant?: string };
type CtaItem =
  | {
      text: string;
      href?: string;
      onClick?: () => void;
    }
  | {
      primary?: { text: string; href?: string };
      secondary?: { text: string; href?: string };
    };

interface ProductCardProps {
  title?: string;
  name?: string; // alias for title
  tagline?: string;
  description: string;
  price?: string;
  image?: string;
  href?: string;
  cta?: CtaItem;
  badge?: BadgeItem;
  features?: FeatureItem[];
  className?: string;
  logo?: React.ReactNode;
  gradient?: string;
}

export function ProductCard({
  title,
  name,
  tagline,
  description,
  price,
  image,
  href,
  cta,
  badge,
  features,
  className,
  logo,
  gradient,
}: ProductCardProps) {
  const displayTitle = title || name || '';
  const badgeText = typeof badge === 'string' ? badge : badge?.text;
  const badgeVariant = typeof badge === 'object' ? badge.variant : undefined;

  const badgeColors: Record<string, string> = {
    new: 'bg-green-100 text-green-700',
    beta: 'bg-yellow-100 text-yellow-700',
    coming: 'bg-purple-100 text-purple-700',
    default: 'bg-blue-100 text-blue-700',
  };

  const content = (
    <Card
      className={cn(
        'h-full overflow-hidden hover:shadow-lg transition-shadow',
        gradient && `bg-gradient-to-br ${gradient}`,
        className
      )}
    >
      {image && (
        <div className="aspect-video bg-gray-100 overflow-hidden">
          <img src={image} alt={title} className="w-full h-full object-cover" />
        </div>
      )}
      <CardContent className="p-6">
        {logo && <div className="mb-4">{logo}</div>}
        {badgeText && (
          <span
            className={cn(
              'inline-block px-2 py-1 text-xs font-medium rounded-full mb-3',
              badgeColors[badgeVariant || 'default'] || badgeColors.default
            )}
          >
            {badgeText}
          </span>
        )}
        <h3 className="text-xl font-semibold mb-2">{displayTitle}</h3>
        {tagline && <p className="text-sm text-gray-500 mb-2">{tagline}</p>}
        <p className="text-gray-600 mb-4">{description}</p>
        {price && <p className="text-2xl font-bold text-blue-600 mb-4">{price}</p>}
        {features && features.length > 0 && (
          <ul className="space-y-2 mb-4">
            {features.map((feature, index) => {
              const isObject = typeof feature === 'object';
              const text = isObject ? feature.text : feature;
              const icon = isObject ? feature.icon : null;
              return (
                <li key={index} className="flex items-center text-sm text-gray-600">
                  {icon ? (
                    <span className="w-4 h-4 mr-2">{icon}</span>
                  ) : (
                    <svg
                      className="w-4 h-4 mr-2 text-green-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                  {text}
                </li>
              );
            })}
          </ul>
        )}
        {cta &&
          ('text' in cta ? (
            cta.href ? (
              <Link href={cta.href}>
                <Button variant="creative" className="w-full">
                  {cta.text}
                </Button>
              </Link>
            ) : (
              <Button variant="creative" className="w-full" onClick={cta.onClick}>
                {cta.text}
              </Button>
            )
          ) : (
            <div className="flex gap-2">
              {cta.primary && (
                <Link href={cta.primary.href || '#'} className="flex-1">
                  <Button variant="creative" className="w-full">
                    {cta.primary.text}
                  </Button>
                </Link>
              )}
              {cta.secondary && (
                <Link href={cta.secondary.href || '#'} className="flex-1">
                  <Button variant="outline" className="w-full">
                    {cta.secondary.text}
                  </Button>
                </Link>
              )}
            </div>
          ))}
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }

  return content;
}
