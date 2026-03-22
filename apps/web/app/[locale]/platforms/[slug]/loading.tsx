import { Container } from '@/components/ui';
import { Skeleton, SkeletonContainer } from '@/components/Skeleton';

export default function PlatformDetailLoading() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <Container>
          <SkeletonContainer>
            <div className="max-w-3xl mx-auto text-center">
              <Skeleton variant="rounded" width={80} height={28} className="mx-auto mb-4" />
              <Skeleton width="70%" height={48} className="mx-auto mb-4" />
              <Skeleton width="90%" height={24} className="mx-auto mb-8" />
              <div className="flex gap-4 justify-center">
                <Skeleton variant="rounded" width={160} height={48} />
                <Skeleton variant="rounded" width={160} height={48} />
              </div>
            </div>
          </SkeletonContainer>
        </Container>
      </section>

      {/* Problem / Solution Section */}
      <section className="py-20">
        <Container>
          <SkeletonContainer>
            <div className="grid md:grid-cols-2 gap-12">
              <div>
                <Skeleton width="40%" height={32} className="mb-4" />
                <Skeleton width="100%" className="mb-2" />
                <Skeleton width="95%" className="mb-2" />
                <Skeleton width="85%" />
              </div>
              <div>
                <Skeleton width="40%" height={32} className="mb-4" />
                <Skeleton width="100%" className="mb-2" />
                <Skeleton width="90%" className="mb-2" />
                <Skeleton width="80%" />
              </div>
            </div>
          </SkeletonContainer>
        </Container>
      </section>

      {/* Taste Placeholder */}
      <section className="py-20 bg-white dark:bg-gray-950">
        <Container>
          <SkeletonContainer>
            <Skeleton width="30%" height={32} className="mx-auto mb-10" />
            <Skeleton variant="rounded" width="100%" height={300} />
          </SkeletonContainer>
        </Container>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <Container>
          <SkeletonContainer>
            <Skeleton width="30%" height={32} className="mx-auto mb-12" />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="p-6 rounded-xl border border-gray-200 dark:border-gray-800">
                  <Skeleton variant="rounded" width={40} height={40} className="mb-4" />
                  <Skeleton width="100%" className="mb-1" />
                  <Skeleton width="80%" />
                </div>
              ))}
            </div>
          </SkeletonContainer>
        </Container>
      </section>
    </main>
  );
}
