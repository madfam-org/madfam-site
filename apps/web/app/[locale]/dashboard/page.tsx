import { redirect } from 'next/navigation';
import { DashboardContent } from '@/components/DashboardContent';
import { getServerAuth } from '@/lib/auth';

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await getServerAuth();

  if (!session) {
    redirect(`/${locale}/auth/signin`);
  }

  return (
    <DashboardContent userEmail={session.user.email || ''} userRole={session.user.role || 'User'} />
  );
}
