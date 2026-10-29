import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { localizedAlternates } from '@/lib/seo';
import { TEAM_CARDS, appName, cardCopy, findTeamCard, qrSrc } from '@/lib/team-cards';

export const dynamicParams = false;

export function generateStaticParams() {
  return TEAM_CARDS.map(card => ({ person: card.slug }));
}

/**
 * Presenter mode: the teammate's own phone shows this to the person in front of
 * them. It is also the installable home-screen app (manifest + Apple meta live
 * here, not on the card, so a visitor who saves the card does not get someone
 * else's QR). The app opens madfam.io directly, so presenting never logs a
 * marca scan; only the visitor's scan of the QR does.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; person: string }>;
}): Promise<Metadata> {
  const { locale, person } = await params;
  const card = findTeamCard(person);
  if (!card) return {};
  return {
    title: `${card.name} · MADFAM`,
    alternates: localizedAlternates(locale, `/c/${card.slug}/qr`),
    robots: { index: false, follow: false },
    manifest: `/c/${card.slug}/manifest.webmanifest`,
    icons: { icon: '/favicon.svg', apple: '/c/icons/apple-touch-icon.png' },
    appleWebApp: { capable: true, title: appName(card), statusBarStyle: 'black-translucent' },
  };
}

export default async function TeamCardPresenterPage({
  params,
}: {
  params: Promise<{ locale: string; person: string }>;
}) {
  const { locale, person } = await params;
  const card = findTeamCard(person);
  if (!card) notFound();
  const t = cardCopy(locale);

  return (
    // Covers the site chrome (navbar z-50): presenting is a full-screen moment.
    <main className="fixed inset-0 z-[100] isolate flex flex-col items-center justify-center overflow-hidden bg-obsidian px-6 pt-[max(5rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))] text-pearl selection:bg-lavender/50">
      <div
        aria-hidden="true"
        className="absolute -top-40 -left-40 -z-10 h-[26rem] w-[26rem] rounded-full bg-leaf/25 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute -right-40 -bottom-40 -z-10 h-[26rem] w-[26rem] rounded-full bg-lavender/30 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute top-[42%] left-1/2 -z-10 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-linear-to-r/oklch from-leaf via-lavender to-sun opacity-20 blur-3xl motion-safe:animate-pulse"
      />

      <div className="absolute top-[max(1.5rem,env(safe-area-inset-top))] left-1/2 flex -translate-x-1/2 items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element -- static brand SVG */}
        <img
          src="/assets/brand/madfam-logo.svg"
          alt=""
          width={36}
          height={36}
          className="h-9 w-9"
        />
        <span className="text-sm font-bold tracking-[0.2em] text-pearl/85">MADFAM</span>
      </div>

      <div className="rounded-[28px] bg-linear-to-br/oklch from-leaf via-lavender to-sun p-0.5 shadow-[0_28px_64px_-18px_rgba(0,0,0,0.7)]">
        <div className="rounded-[26px] bg-white p-4">
          {/* eslint-disable-next-line @next/next/no-img-element -- crisp static QR SVG; next/image would rasterise it */}
          <img
            src={qrSrc(card)}
            alt={card.shortLink}
            width={320}
            height={320}
            className="block aspect-square w-[min(72vw,20rem)] [image-rendering:pixelated]"
          />
        </div>
      </div>

      <h1 className="mt-8 w-fit max-w-full bg-linear-to-r/oklch from-leaf via-lavender to-sun bg-clip-text text-center text-3xl leading-[1.1] font-extrabold tracking-[-0.03em] text-balance text-transparent">
        {card.name}
      </h1>
      <p className="mt-2 text-center text-base text-pearl/90">
        {card.title ? `${card.title} · MADFAM` : 'Innovaciones MADFAM'}
      </p>

      <span className="mt-6 rounded-full border border-white/20 bg-white/5 px-4 py-2 font-mono text-base font-semibold">
        {card.shortLink}
      </span>
      <p className="mt-3 text-sm text-pearl/75">{t.scanHint}</p>

      <a
        href={`/${locale}/c/${card.slug}`}
        className="mt-6 text-sm font-medium text-pearl/80 underline decoration-lavender/60 underline-offset-4 hover:text-pearl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sun"
      >
        {t.viewCard}
      </a>
    </main>
  );
}
