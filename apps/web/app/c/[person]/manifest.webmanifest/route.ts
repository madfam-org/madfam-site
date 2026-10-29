import { notFound } from 'next/navigation';
import { TEAM_CARDS, appName, findTeamCard } from '@/lib/team-cards';

// One web app manifest per teammate: installing the presenter page from Safari
// or Chrome gives a home-screen app that opens straight into the QR. Outside
// [locale] on purpose — middleware passes dotted multi-segment paths through.
export const dynamic = 'force-static';
export const dynamicParams = false;

export function generateStaticParams() {
  return TEAM_CARDS.map(card => ({ person: card.slug }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ person: string }> }) {
  const { person } = await params;
  const card = findTeamCard(person);
  if (!card) notFound();
  const manifest = {
    id: `/es/c/${card.slug}/qr`,
    name: `${card.name} · MADFAM`,
    short_name: appName(card),
    description: `${card.name} — ${card.shortLink}`,
    start_url: `/es/c/${card.slug}/qr`,
    scope: `/es/c/${card.slug}/`,
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0A0E27',
    theme_color: '#0A0E27',
    icons: [
      { src: '/c/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/c/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/c/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
  return new Response(JSON.stringify(manifest), {
    headers: { 'Content-Type': 'application/manifest+json; charset=utf-8' },
  });
}
