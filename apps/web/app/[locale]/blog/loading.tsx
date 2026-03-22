import { Container } from '@/components/ui';
import { Skeleton, SkeletonContainer } from '@/components/Skeleton';

export default function BlogLoading() {
  return (
    <main className="py-section">
      <Container>
        {/* Header */}
        <div className="text-center mb-16">
          <SkeletonContainer>
            <Skeleton width="40%" height={48} className="mx-auto mb-4" />
            <Skeleton width="60%" height={24} className="mx-auto" />
          </SkeletonContainer>
        </div>

        {/* Blog Post Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden"
            >
              <SkeletonContainer>
                <Skeleton variant="rectangular" width="100%" height={200} />
                <div className="p-6">
                  <Skeleton width="30%" height={16} className="mb-3" />
                  <Skeleton width="90%" height={24} className="mb-2" />
                  <Skeleton width="100%" className="mb-1" />
                  <Skeleton width="80%" className="mb-4" />
                  <div className="flex items-center gap-3 mt-4">
                    <Skeleton variant="circular" width={32} height={32} />
                    <Skeleton width="40%" height={14} />
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
