import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArrowUpRight, CalendarDays, ChevronRight, Linkedin, Mail, UserPlus } from 'lucide-react';
import { localizedAlternates } from '@/lib/seo';
import { DEFAULT_OG_IMAGE } from '@/lib/seo-urls';
import { BookingLauncher } from '@/components/booking/BookingLauncher';
import { cardAttribution } from '@/lib/kalya-embed';
import { TEAM_CARDS, cardCopy, findTeamCard } from '@/lib/team-cards';

export const dynamicParams = false;

export function generateStaticParams() {
  return TEAM_CARDS.map(card => ({ person: card.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; person: string }>;
}): Promise<Metadata> {
  const { locale, person } = await params;
  const card = findTeamCard(person);
  if (!card) return {};
  const title = `${card.name} · MADFAM`;
  const description = `${cardCopy(locale).description}: ${card.name}`;
  return {
    title,
    description,
    alternates: localizedAlternates(locale, `/c/${card.slug}`),
    openGraph: { title, description, type: 'profile', images: [DEFAULT_OG_IMAGE] },
    // A person's card is reached by QR, not by search.
    robots: { index: false, follow: true },
  };
}

// The card inherits the home hero's world (EcosystemHomePage): obsidian ground,
// leaf/lavender glows, the leaf→lavender→sun brand gradient and its pulsing
// halo as the one moving thing. The primary action sets obsidian text on
// leaf→sun so it clears AA; white on leaf does not.
const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sun';

const secondaryAction = `group flex items-center gap-4 w-full rounded-xl border border-white/15 bg-white/5 px-5 py-4 text-pearl transition-colors duration-200 hover:border-white/35 hover:bg-white/10 ${focusRing}`;

export default async function TeamCardPage({
  params,
}: {
  params: Promise<{ locale: string; person: string }>;
}) {
  const { locale, person } = await params;
  const card = findTeamCard(person);
  if (!card) notFound();
  const t = cardCopy(locale);

  return (
    <main className="relative isolate min-h-[100svh] overflow-hidden bg-obsidian px-4 pt-24 pb-16 selection:bg-lavender/50 selection:text-pearl">
      <div
        aria-hidden="true"
        className="absolute -top-24 -left-24 -z-10 h-96 w-96 rounded-full bg-leaf/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute -right-24 -bottom-24 -z-10 h-96 w-96 rounded-full bg-lavender/25 blur-3xl"
      />

      <div className="relative mx-auto w-full max-w-md">
        <div
          aria-hidden="true"
          className="absolute -inset-6 rounded-[2rem] bg-gradient-to-r from-leaf via-lavender to-sun opacity-25 blur-3xl motion-safe:animate-pulse"
        />

        <div className="relative rounded-2xl bg-gradient-to-br from-leaf via-lavender to-sun p-px shadow-[0_24px_64px_-16px_rgba(0,0,0,0.6)]">
          <article className="rounded-2xl bg-obsidian/95 px-6 pt-8 pb-6 sm:px-8">
            {/* OKLCH interpolation: the sRGB leaf→lavender blend passes through gray. */}
            <h1 className="bg-linear-to-r/oklch from-leaf via-lavender to-sun bg-clip-text text-[2.6rem] leading-[1.05] font-bold tracking-[-0.03em] text-balance text-transparent">
              {card.name}
            </h1>
            <p className="mt-3 text-lg leading-snug text-pearl/90">
              {card.title ?? 'Innovaciones MADFAM'}
            </p>
            {card.title && <p className="mt-1 text-base text-pearl/70">Innovaciones MADFAM</p>}

            <a
              href={`/c/${card.slug}.vcf`}
              download={`${card.slug}.vcf`}
              className={`mt-8 flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-leaf to-sun px-5 py-4 text-lg font-bold text-obsidian shadow-[0_12px_32px_-12px_rgba(107,203,119,0.7)] transition-[filter,transform] duration-200 hover:brightness-110 active:scale-[0.99] ${focusRing}`}
            >
              <UserPlus aria-hidden="true" className="h-5 w-5" strokeWidth={2.25} />
              {t.saveContact}
            </a>

            <div className="mt-3 space-y-3">
              {/* Opens MADFAM's Kalya flow in-page; the href (bookingUrl) is the fallback. */}
              <BookingLauncher attribution={cardAttribution(card.slug)} className={secondaryAction}>
                <CalendarDays aria-hidden="true" className="h-5 w-5 text-sun" strokeWidth={1.75} />
                <span className="flex-1 font-medium">{t.book}</span>
                {/* Chevron, not the ↗ of the outbound links below: booking opens on this page. */}
                <ChevronRight
                  aria-hidden="true"
                  className="h-4 w-4 text-pearl/50 transition-transform duration-200 group-hover:translate-x-0.5"
                />
              </BookingLauncher>
              {card.linkedin && (
                <a href={card.linkedin} rel="noopener" className={secondaryAction}>
                  <Linkedin
                    aria-hidden="true"
                    className="h-5 w-5 text-lavender"
                    strokeWidth={1.75}
                  />
                  <span className="flex-1 font-medium">{t.linkedin}</span>
                  <ArrowUpRight
                    aria-hidden="true"
                    className="h-4 w-4 text-pearl/50 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  />
                </a>
              )}
              <a href={`mailto:${card.email}`} className={secondaryAction}>
                <Mail aria-hidden="true" className="h-5 w-5 text-leaf" strokeWidth={1.75} />
                <span className="flex-1 min-w-0">
                  <span className="block font-medium">{t.email}</span>
                  <span className="block truncate text-sm text-pearl/70">{card.email}</span>
                </span>
              </a>
            </div>

            <div className="mt-8 flex items-center justify-between gap-4 border-t border-white/10 pt-5 text-sm">
              <a
                href={`/${locale}/c/${card.slug}/qr`}
                className={`font-mono text-pearl/80 underline decoration-white/25 underline-offset-4 hover:text-pearl ${focusRing}`}
                aria-label={`${t.present}: ${card.shortLink}`}
              >
                {card.shortLink}
              </a>
              <a
                href={`/${locale}`}
                className={`font-medium text-pearl/80 underline decoration-lavender/60 underline-offset-4 transition-colors hover:text-pearl ${focusRing}`}
              >
                {t.site}
              </a>
            </div>
          </article>
        </div>
      </div>
    </main>
  );
}
