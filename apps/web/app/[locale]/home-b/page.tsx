import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { VisionFirstHomePage } from '@/components/VisionFirstHomePage';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export const metadata: Metadata = {
  title: 'MADFAM - Building Regenerative Futures',
  description:
    'We create AI-powered tools and experiences that amplify human potential while respecting our planet. Technology should give back more than it takes.',
  openGraph: {
    title: 'MADFAM - Building Regenerative Futures',
    description:
      'We create AI-powered tools and experiences that amplify human potential while respecting our planet.',
    type: 'website',
  },
};

export default async function HomeVariantBPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <VisionFirstHomePage />;
}
