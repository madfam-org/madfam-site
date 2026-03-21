'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (Sentry.isInitialized()) {
      Sentry.captureException(error);
    }
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center p-8 max-w-md">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">Something went wrong!</h1>
            <p className="text-gray-600 mb-8">
              A critical error occurred. Please try refreshing the page.
            </p>
            <button
              onClick={() => reset()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try again
            </button>
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-8 p-4 bg-red-100 rounded-lg text-left">
                <p className="text-sm font-mono text-red-700">Error: {error.message}</p>
                {error.digest && (
                  <p className="text-xs text-red-600 mt-2">Digest: {error.digest}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}
