import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { localizedAlternates } from '@/lib/seo';
import { TEAM_CARDS, bookingUrl, cardCopy, findTeamCard } from '@/lib/team-cards';

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
    openGraph: { title, description, type: 'profile' },
    // A person's card is reached by QR, not by search.
    robots: { index: false, follow: true },
  };
}

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
    <main className="min-h-screen flex items-center justify-center py-16 bg-gradient-to-br from-obsidian/5 to-lavender/5">
      <div className="max-w-md w-full mx-4 p-8 bg-white rounded-xl shadow-sm text-center">
        <h1 className="text-2xl font-semibold text-obsidian">{card.name}</h1>
        <p className="mt-1 text-obsidian/70">{card.title ? `${card.title} · MADFAM` : 'MADFAM'}</p>
        <p className="mt-1 text-sm text-obsidian/60">{card.email}</p>

        <div className="mt-8 space-y-3">
          <a
            href={`/c/${card.slug}.vcf`}
            download={`${card.slug}.vcf`}
            className="block w-full py-3 bg-obsidian text-white rounded-lg font-medium hover:bg-obsidian/90 transition-colors"
          >
            {t.saveContact}
          </a>
          <a
            href={bookingUrl(card.slug)}
            className="block w-full py-3 border border-obsidian/20 text-obsidian rounded-lg font-medium hover:bg-obsidian/5 transition-colors"
          >
            {t.book}
          </a>
          <a
            href={`mailto:${card.email}`}
            className="block w-full py-3 border border-obsidian/20 text-obsidian rounded-lg font-medium hover:bg-obsidian/5 transition-colors"
          >
            {t.email}
          </a>
          <a
            href={`/${locale}`}
            className="block w-full py-3 text-obsidian/70 rounded-lg font-medium hover:text-obsidian transition-colors"
          >
            {t.site}
          </a>
        </div>
      </div>
    </main>
  );
}
