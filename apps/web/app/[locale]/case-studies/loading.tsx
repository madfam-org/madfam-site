import { Container } from '@/components/ui';
import { Skeleton, SkeletonContainer } from '@/components/Skeleton';

export default function CaseStudiesLoading() {
  return (
    <main className="py-section">
      <Container>
        {/* Header */}
        <div className="text-center mb-16">
          <SkeletonContainer>
            <Skeleton width="45%" height={48} className="mx-auto mb-4" />
            <Skeleton width="65%" height={24} className="mx-auto" />
          </SkeletonContainer>
        </div>

        {/* Case Study Cards */}
        <div className="grid md:grid-cols-2 gap-8">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden"
            >
              <SkeletonContainer>
                <Skeleton variant="rectangular" width="100%" height={220} />
                <div className="p-6">
                  <Skeleton variant="rounded" width={100} height={24} className="mb-3" />
                  <Skeleton width="80%" height={28} className="mb-2" />
                  <Skeleton variant="rounded" width={120} height={20} className="mb-4" />
                  <Skeleton width="100%" className="mb-1" />
                  <Skeleton width="90%" className="mb-6" />
                  <div className="grid grid-cols-3 gap-4">
                    {[...Array(3)].map((__, j) => (
                      <div key={j} className="text-center">
                        <Skeleton width="60%" height={28} className="mx-auto mb-1" />
                        <Skeleton width="80%" height={12} className="mx-auto" />
                      </div>
                    ))}
                  </div>
                </div>
              </SkeletonContainer>
            </div>
          ))}
        </div>
      </Container>
    </main>
  );
}
