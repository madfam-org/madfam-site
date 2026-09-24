import { routeMetadata } from '@/lib/page-metadata';

// The unsubscribe page is a client component, so its metadata lives here. It is
// a utility page: never indexed (finding C-023).
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return routeMetadata(locale, 'unsubscribe', '/unsubscribe', { noIndex: true });
}

export default function UnsubscribeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
