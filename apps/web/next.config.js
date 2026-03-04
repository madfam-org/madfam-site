const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@madfam/ui',
    '@madfam/core',
    '@madfam/analytics',
    '@madfam/i18n',
    '@janua/nextjs',
    '@janua/ui',
  ],

  // Use static export for GitHub Pages, standalone for Docker/K8s
  output: process.env.DEPLOY_TARGET === 'github-pages' ? 'export' : 'standalone',

  // Configure base path only for GitHub Pages
  basePath: process.env.DEPLOY_TARGET === 'github-pages' ? '/biz-site' : '',

  // Add trailing slash only for static export
  trailingSlash: process.env.DEPLOY_TARGET === 'github-pages' ? true : false,

  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    minimumCacheTTL: 31536000,
    // Disable image optimization for static export
    unoptimized: process.env.DEPLOY_TARGET === 'github-pages',
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Webpack optimizations for production
  webpack: (config, { buildId, dev, isServer, defaultLoaders, nextRuntime, webpack }) => {
    // Suppress Edge Runtime warnings for React 19 compatibility
    // These warnings are non-breaking - React uses process.emit internally but
    // it's not actually called in our Edge Runtime middleware
    if (nextRuntime === 'edge') {
      config.resolve.alias = {
        ...config.resolve.alias,
        // Provide empty stubs for Node.js modules in Edge Runtime
        process: false,
      };

      // Suppress the specific warnings about Node.js API usage
      config.ignoreWarnings = [
        ...(config.ignoreWarnings || []),
        /A Node.js API is used \(process\.emit/,
      ];
    }

    if (!dev) {
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks.cacheGroups,
          framerMotion: {
            name: 'framer-motion',
            test: /[\\/]node_modules[\\/]framer-motion[\\/]/,
            chunks: 'all',
            enforce: true,
          },
          ui: {
            name: 'ui',
            test: /[\\/]packages[\\/]ui[\\/]/,
            chunks: 'all',
            priority: 10,
          },
        },
      };
    }
    return config;
  },

  async redirects() {
    return [
      // Services to Programs mapping (permanent)
      {
        source: '/services',
        destination: '/programs',
        permanent: true,
      },
      {
        source: '/:locale/services',
        destination: '/:locale/programs',
        permanent: true,
      },

      // Legacy locale redirects (es-MX → es, en-US → en, pt-BR → pt)
      {
        source: '/es-MX/:path*',
        destination: '/es/:path*',
        permanent: true,
      },
      {
        source: '/en-US/:path*',
        destination: '/en/:path*',
        permanent: true,
      },
      {
        source: '/pt-BR/:path*',
        destination: '/pt/:path*',
        permanent: true,
      },
      {
        source: '/pt-br/:path*',
        destination: '/pt/:path*',
        permanent: true,
      },
    ];
  },

  async rewrites() {
    // Generate rewrites from i18n configuration for normalized locales
    const rewrites = [];

    // Spanish rewrites - main pages (es → localized routes)
    rewrites.push(
      { source: '/es/soluciones', destination: '/es/solutions' },
      { source: '/es/productos', destination: '/es/products' },
      { source: '/es/programas', destination: '/es/programs' },
      { source: '/es/casos', destination: '/es/work' },
      { source: '/es/seguridad', destination: '/es/security' },
      { source: '/es/sobre', destination: '/es/about' },
      { source: '/es/contacto', destination: '/es/contact' }
    );

    // Spanish rewrites - corporate structure
    rewrites.push(
      { source: '/es/soluciones/colabs', destination: '/es/solutions/colabs' },
      { source: '/es/soluciones/showtech', destination: '/es/solutions/showtech' }
    );

    // Portuguese rewrites - main pages (pt → localized routes)
    rewrites.push(
      { source: '/pt/solucoes', destination: '/pt/solutions' },
      { source: '/pt/produtos', destination: '/pt/products' },
      { source: '/pt/programas', destination: '/pt/programs' },
      { source: '/pt/casos', destination: '/pt/work' },
      { source: '/pt/seguranca', destination: '/pt/security' },
      { source: '/pt/sobre', destination: '/pt/about' },
      { source: '/pt/contato', destination: '/pt/contact' },
      // Legacy routes
      { source: '/pt/carreiras', destination: '/pt/careers' },
      { source: '/pt/casos-de-sucesso', destination: '/pt/case-studies' },
      { source: '/pt/documentacao', destination: '/pt/docs' },
      { source: '/pt/guias', destination: '/pt/guides' },
      { source: '/pt/avaliacao', destination: '/pt/assessment' },
      { source: '/pt/calculadora', destination: '/pt/calculator' },
      { source: '/pt/estimador', destination: '/pt/estimator' },
      { source: '/pt/privacidade', destination: '/pt/privacy' },
      { source: '/pt/termos', destination: '/pt/terms' },
      { source: '/pt/cookies', destination: '/pt/cookies' }
    );

    // Portuguese rewrites - corporate structure
    rewrites.push(
      { source: '/pt/solucoes/colabs', destination: '/pt/solutions/colabs' },
      { source: '/pt/solucoes/showtech', destination: '/pt/solutions/showtech' }
    );

    return rewrites;
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
        ],
      },
      // API Routes specific headers
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NEXT_PUBLIC_APP_URL || 'https://madfam.io',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value:
              'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization',
          },
          {
            key: 'Access-Control-Max-Age',
            value: '86400',
          },
        ],
      },
    ];
  },

  // Next.js 15+ external packages configuration
  serverExternalPackages: ['@prisma/client'],

  experimental: {
    optimizeCss: false, // Disabled to avoid critters dependency issue
    scrollRestoration: true,
    serverMinification: true,
    optimizePackageImports: ['framer-motion', 'lucide-react'],
  },

  // Turbopack configuration for Next.js 15+
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
};

module.exports = withNextIntl(nextConfig);
