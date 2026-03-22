'use client';

import { useState } from 'react';
import { Button } from './Button';
import { cn } from './utils';

interface NewsletterProps {
  title?: string;
  description?: string;
  placeholder?: string;
  submitText?: string;
  buttonText?: string; // alias for submitText
  variant?: 'inline' | 'stacked' | 'card';
  className?: string;
  onSubscribe?: (email: string) => Promise<void>;
}

export function Newsletter({
  title = 'Subscribe to our newsletter',
  description = 'Get the latest updates delivered to your inbox.',
  placeholder = 'Enter your email',
  submitText,
  buttonText,
  variant = 'inline',
  className,
  onSubscribe,
}: NewsletterProps) {
  const buttonLabel = submitText || buttonText || 'Subscribe';
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    try {
      await onSubscribe?.(email);
      setStatus('success');
      setEmail('');
    } catch {
      setStatus('error');
    }
  };

  const isInline = variant === 'inline';

  return (
    <div className={cn(variant === 'card' && 'bg-white rounded-xl shadow-lg p-8', className)}>
      {title && <h3 className="text-xl font-semibold mb-2">{title}</h3>}
      {description && <p className="text-gray-600 mb-4">{description}</p>}

      <form
        onSubmit={handleSubmit}
        className={cn('flex gap-3', isInline ? 'flex-row' : 'flex-col')}
      >
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder={placeholder}
          aria-label="Email address"
          aria-invalid={status === 'error'}
          aria-describedby={status !== 'idle' ? 'newsletter-status' : undefined}
          className={cn(
            'px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent',
            isInline ? 'flex-grow' : 'w-full'
          )}
          required
        />
        <Button
          type="submit"
          variant="creative"
          loading={status === 'loading'}
          disabled={status === 'loading'}
          className={cn(!isInline && 'w-full')}
        >
          {buttonLabel}
        </Button>
      </form>

      {status === 'success' && (
        <p id="newsletter-status" role="status" className="text-green-600 text-sm mt-2">
          Thanks for subscribing!
        </p>
      )}
      {status === 'error' && (
        <p id="newsletter-status" role="alert" className="text-red-600 text-sm mt-2">
          Something went wrong. Please try again.
        </p>
      )}
    </div>
  );
}
