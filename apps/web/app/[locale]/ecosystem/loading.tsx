import { Container } from '@/components/ui';
import { CardSkeleton, Skeleton, SkeletonContainer } from '@/components/Skeleton';

export default function EcosystemLoading() {
  return (
    <main className="py-section">
      <Container>
        {/* Hero */}
        <div className="text-center mb-16">
          <SkeletonContainer>
            <Skeleton width="50%" height={48} className="mx-auto mb-4" />
            <Skeleton width="70%" height={24} className="mx-auto mb-8" />
            <Skeleton variant="rounded" width={180} height={48} className="mx-auto" />
          </SkeletonContainer>
        </div>

        {/* Platform Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="p-6 rounded-xl border border-gray-200 dark:border-gray-800">
              <SkeletonContainer>
                <div className="flex items-center gap-3 mb-4">
                  <Skeleton variant="rounded" width={48} height={48} />
                  <Skeleton width="50%" height={24} />
                </div>
                <Skeleton width="100%" className="mb-1" />
                <Skeleton width="85%" className="mb-4" />
                <Skeleton variant="rounded" width="100%" height={40} />
              </SkeletonContainer>
            </div>
          ))}
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {[...Array(3)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </Container>
    </main>
  );
}
