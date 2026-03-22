import { Container } from '@/components/ui';
import { Skeleton, SkeletonContainer } from '@/components/Skeleton';

export default function SolutionsLoading() {
  return (
    <main className="py-section">
      <Container>
        {/* Header */}
        <div className="text-center mb-16">
          <SkeletonContainer>
            <Skeleton width="45%" height={48} className="mx-auto mb-4" />
            <Skeleton width="60%" height={24} className="mx-auto" />
          </SkeletonContainer>
        </div>

        {/* Solution Cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-8 rounded-2xl border border-gray-200 dark:border-gray-800">
              <SkeletonContainer>
                <Skeleton variant="rounded" width={56} height={56} className="mb-6" />
                <Skeleton width="60%" height={28} className="mb-2" />
                <Skeleton width="80%" height={18} className="mb-4" />
                <Skeleton width="100%" className="mb-1" />
                <Skeleton width="95%" className="mb-1" />
                <Skeleton width="85%" className="mb-6" />
                <div className="space-y-3 mb-8">
                  {[...Array(3)].map((__, j) => (
                    <div key={j} className="flex gap-3">
                      <Skeleton variant="circular" width={20} height={20} />
                      <Skeleton width="75%" />
                    </div>
                  ))}
                </div>
                <Skeleton variant="rounded" width="100%" height={48} />
              </SkeletonContainer>
            </div>
          ))}
        </div>
      </Container>
    </main>
  );
}
