import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <section className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-lavender rounded-full filter blur-3xl animate-float" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-sun rounded-full filter blur-3xl animate-float animation-delay-400" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-2xl mx-auto">
            {/* 404 Graphic */}
            <div className="mb-8">
              <div className="text-[150px] font-bold leading-none">
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  404
                </span>
              </div>
              <div className="text-6xl mb-4">🤔</div>
            </div>

            <h1 className="text-4xl font-bold mb-4">Page Not Found</h1>

            <p className="text-xl text-gray-600 mb-8">
              The page you&apos;re looking for doesn&apos;t exist or has been moved.
            </p>

            <div className="flex flex-wrap gap-4 justify-center mb-12">
              <Link
                href="/"
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-300"
              >
                Go Home
              </Link>
              <Link
                href="/programs"
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-300"
              >
                Explore Services
              </Link>
            </div>

            {/* Helpful links */}
            <div className="pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-500 mb-4">Helpful Links</p>
              <div className="flex flex-wrap gap-6 justify-center text-sm">
                <Link
                  href="/products"
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Products
                </Link>
                <Link href="/about" className="text-blue-600 hover:text-blue-800 transition-colors">
                  About
                </Link>
                <Link
                  href="/contact"
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Contact
                </Link>
                <Link
                  href="/assessment"
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                >
                  AI Assessment
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
