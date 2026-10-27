import { notFound } from 'next/navigation';

/**
 * Unknown paths under a locale (`/es/no-existe`) would otherwise fall through
 * to the root `app/not-found.tsx`, which sits above the locale layout: no
 * header, no footer and no translations. Calling `notFound()` here renders
 * `app/[locale]/not-found.tsx` inside the locale layout instead, with a 404.
 */
export default function UnknownLocalePath() {
  notFound();
}
