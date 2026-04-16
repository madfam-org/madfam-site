'use client';

import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

export default function UnsubscribePage() {
  const t = useTranslations('legal.unsubscribe');
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email') || '';

  const [email, setEmail] = useState(emailParam);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  async function handleUnsubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !email.includes('@')) return;

    setStatus('loading');
    try {
      const resp = await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (resp.ok) {
        setStatus('success');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-obsidian/5 to-lavender/5">
      <div className="max-w-md w-full mx-4 p-8 bg-white rounded-xl shadow-sm">
        {status === 'success' ? (
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-obsidian mb-4">{t('successTitle')}</h1>
            <p className="text-obsidian/70">{t('successMessage')}</p>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-semibold text-obsidian mb-2">{t('title')}</h1>
            <p className="text-obsidian/70 mb-6">{t('description')}</p>
            <form onSubmit={handleUnsubscribe} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-obsidian/80 mb-1">
                  {t('emailLabel')}
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={t('emailPlaceholder')}
                  className="w-full px-4 py-3 border border-obsidian/20 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-lavender/50"
                />
              </div>
              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full py-3 bg-obsidian text-white rounded-lg font-medium hover:bg-obsidian/90 disabled:opacity-50 transition-colors"
              >
                {status === 'loading' ? t('processing') : t('confirmButton')}
              </button>
              {status === 'error' && <p className="text-sm text-red-600">{t('errorMessage')}</p>}
            </form>
            <p className="mt-6 text-xs text-obsidian/50 text-center">{t('footer')}</p>
          </>
        )}
      </div>
    </main>
  );
}
