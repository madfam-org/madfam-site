import Link from 'next/link';

/**
 * The application-wide 404, for URLs that match no route at all.
 *
 * IT RENDERS INSIDE `app/layout.tsx`. That is the whole contract of the App
 * Router's root `not-found.tsx`, and it is what this file used to get wrong: it
 * returned its own `<html><body>` wrapper, so every 404 the site served came
 * back with an `<html>` inside an `<html>` and a `<body>` inside a `<body>`.
 * Only the root layout may emit those tags.
 *
 * There is no i18n here on purpose. This boundary sits ABOVE `app/[locale]`, so
 * no `NextIntlClientProvider` is mounted and there is no locale in the URL to
 * read one from — a `useTranslations` call here would throw. Localized 404s are
 * `app/[locale]/not-found.tsx`, which renders inside the locale layout with the
 * provider in scope.
 */
export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-obsidian dark:to-gray-900">
      <div className="text-center p-8 max-w-lg">
        {/* 404 Graphic */}
        <div className="mb-8">
          <div className="text-9xl font-bold text-gray-300 dark:text-gray-700">404</div>
          <div className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mt-2">
            Page Not Found
          </div>
        </div>

        <p className="text-gray-600 dark:text-gray-400 mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        <Link
          href="/"
          className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 transform hover:scale-105"
        >
          Return Home
        </Link>

        {/* Decorative elements */}
        <div className="mt-12 flex justify-center gap-2">
          <div className="w-2 h-2 bg-gray-300 dark:bg-gray-700 rounded-full animate-bounce" />
          <div className="w-2 h-2 bg-gray-300 dark:bg-gray-700 rounded-full animate-bounce delay-100" />
          <div className="w-2 h-2 bg-gray-300 dark:bg-gray-700 rounded-full animate-bounce delay-200" />
        </div>
      </div>
    </div>
  );
}
