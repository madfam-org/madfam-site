import { routeMetadata } from '@/lib/page-metadata';

// Route metadata (title, description, canonical + hreflang) for /cookies — finding
// C-023. Kept in a layout so the page file stays untouched.
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return routeMetadata(locale, 'cookies', '/cookies');
}

export default function RouteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
