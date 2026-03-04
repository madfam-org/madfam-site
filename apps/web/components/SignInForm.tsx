'use client';

import { SignInForm as SignIn } from '@janua/nextjs';
import { useTranslations } from 'next-intl';

export function SignInForm() {
  const t = useTranslations();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {t('auth.signin.title')}
          </h2>
        </div>
        <SignIn
          afterSignIn="/dashboard"
          signUpUrl="/auth/signup"
          socialProviders={{ google: true, github: true }}
        />
      </div>
    </div>
  );
}
