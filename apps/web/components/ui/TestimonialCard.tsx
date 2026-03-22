import Image from 'next/image';
import { cn } from './utils';
import { Card, CardContent } from './Card';

type AuthorType = string | { name: string; role?: string; company?: string; avatar?: string };

interface TestimonialCardProps {
  quote: string;
  author: AuthorType;
  role?: string;
  company?: string;
  avatar?: string;
  rating?: number;
  className?: string;
  variant?: 'default' | 'featured' | 'compact';
}

export function TestimonialCard({
  quote,
  author,
  role: propRole,
  company: propCompany,
  avatar: propAvatar,
  rating,
  className,
  variant = 'default',
}: TestimonialCardProps) {
  const isAuthorObject = typeof author === 'object';
  const authorName = isAuthorObject ? author.name : author;
  const role = isAuthorObject ? author.role : propRole;
  const company = isAuthorObject ? author.company : propCompany;
  const avatar = isAuthorObject ? author.avatar : propAvatar;

  const variantStyles = {
    default: '',
    featured: 'border-2 border-blue-500 shadow-lg',
    compact: 'p-4',
  };

  return (
    <Card className={cn('h-full', variantStyles[variant], className)}>
      <CardContent className={cn('flex flex-col h-full', variant === 'compact' ? 'p-4' : 'p-6')}>
        {rating && (
          <div className="flex gap-1 mb-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <svg
                key={i}
                className={cn('w-5 h-5', i < rating ? 'text-yellow-400' : 'text-gray-200')}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
        )}
        <blockquote className="text-gray-600 italic flex-grow mb-4">
          &ldquo;{quote}&rdquo;
        </blockquote>
        <div className="flex items-center gap-3 mt-auto">
          {avatar ? (
            <Image
              src={avatar}
              alt={authorName}
              width={40}
              height={40}
              className="rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
              {authorName.charAt(0)}
            </div>
          )}
          <div>
            <p className="font-semibold text-sm">{authorName}</p>
            {(role || company) && (
              <p className="text-xs text-gray-500">{[role, company].filter(Boolean).join(', ')}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
