import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getAllPlatformSlugs, getPlatformBySlug } from '@/lib/data/platforms';
import { PlatformShowcase } from '@/components/platforms/PlatformShowcase';

export const revalidate = 3600;
export const dynamicParams = false;

interface PlatformPageProps {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
}

// Map slug to i18n translation key (camelCase)
function slugToI18nKey(slug: string): string {
  const map: Record<string, string> = {
    'cotiza-studio': 'cotizaStudio',
    'forge-sight': 'forgeSight',
    'pravara-mes': 'pravaraMes',
  };
  return map[slug] || slug;
}

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  return getAllPlatformSlugs().map(slug => ({ slug }));
}

export async function generateMetadata({ params }: PlatformPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const platform = getPlatformBySlug(slug);

  if (!platform) {
    return { title: 'Platform Not Found | MADFAM' };
  }

  const t = await getTranslations({ locale, namespace: 'platforms' });
  const key = slugToI18nKey(slug);
  const tagline = t(`${key}.tagline`);
  const valueProp = t(`${key}.valueProp`);

  return {
    title: `${platform.name} — ${tagline} | MADFAM`,
    description: valueProp,
    openGraph: {
      title: `${platform.name} — ${tagline} | MADFAM`,
      description: valueProp,
      type: 'website',
    },
  };
}

export default async function PlatformPage({ params }: PlatformPageProps) {
  const { locale, slug } = await params;
  const platform = getPlatformBySlug(slug);

  if (!platform) {
    notFound();
  }

  return <PlatformShowcase platform={platform} locale={locale} />;
}
