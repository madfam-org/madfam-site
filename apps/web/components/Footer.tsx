import { getLocalizedUrl, type Locale } from '@madfam/i18n';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { Container } from '@/components/ui';

export function Footer() {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const currentYear = new Date().getFullYear();

  const navigation = {
    platforms: [
      { name: t('footer.platforms.enclii'), href: `/${locale}/platforms/enclii`, external: false },
      { name: t('footer.platforms.janua'), href: `/${locale}/platforms/janua`, external: false },
      { name: t('footer.platforms.dhanam'), href: `/${locale}/platforms/dhanam`, external: false },
      {
        name: t('footer.platforms.forgeSight'),
        href: `/${locale}/platforms/forge-sight`,
        external: false,
      },
      { name: t('footer.platforms.tezca'), href: `/${locale}/platforms/tezca`, external: false },
      {
        name: t('footer.platforms.cotizaStudio'),
        href: `/${locale}/platforms/cotiza-studio`,
        external: false,
      },
      {
        name: t('footer.platforms.yantra4d'),
        href: `/${locale}/platforms/yantra4d`,
        external: false,
      },
      {
        name: t('footer.platforms.pravaraMes'),
        href: `/${locale}/platforms/pravara-mes`,
        external: false,
      },
      {
        name: t('footer.platforms.penny'),
        href: getLocalizedUrl('products', locale),
        external: false,
      },
      {
        name: t('footer.platforms.avala'),
        href: getLocalizedUrl('products', locale),
        external: false,
      },
    ],
    services: [
      {
        name: t('footer.services.makerNode'),
        href: getLocalizedUrl('solutions.maker-node', locale),
        external: false,
      },
      {
        name: t('footer.services.colabs'),
        href: getLocalizedUrl('solutions.colabs', locale),
        external: false,
      },
      {
        name: t('footer.services.programs'),
        href: getLocalizedUrl('programs', locale),
        external: false,
      },
    ],
    ecosystem: [
      {
        name: t('footer.ecosystem.membership'),
        href: getLocalizedUrl('ecosystem', locale),
        external: false,
      },
      {
        name: t('footer.ecosystem.openSource'),
        href: 'https://github.com/madfam-org',
        external: true,
      },
      {
        name: t('footer.ecosystem.impact'),
        href: getLocalizedUrl('impact', locale),
        external: false,
      },
    ],
    company: [
      { name: t('footer.company.about'), href: getLocalizedUrl('about', locale), external: false },
      {
        name: t('footer.company.careers'),
        href: getLocalizedUrl('careers', locale),
        external: false,
      },
      {
        name: t('footer.company.contact'),
        href: getLocalizedUrl('contact', locale),
        external: false,
      },
    ],
  };

  const social = [
    { name: t('footer.social.linkedin'), href: 'https://linkedin.com/company/madfam', icon: 'in' },
    { name: t('footer.social.twitter'), href: 'https://x.com/madfam_io', icon: 'X' },
    { name: t('footer.social.instagram'), href: 'https://instagram.com/madfam.io', icon: 'ig' },
    {
      name: t('footer.social.facebook'),
      href: 'https://www.facebook.com/people/Madfam/61578707019539/',
      icon: 'fb',
    },
    { name: t('footer.social.tiktok'), href: 'https://tiktok.com/@madfam.io', icon: 'tt' },
    { name: t('footer.social.github'), href: 'https://github.com/madfam-org', icon: 'gh' },
  ];

  return (
    <footer className="bg-gray-50 dark:bg-obsidian text-obsidian dark:text-white border-t border-gray-200 dark:border-gray-800">
      <Container>
        <div className="py-12 lg:py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {(Object.entries(navigation) as [string, typeof navigation.platforms][]).map(
              ([sectionKey, items]) => (
                <div key={sectionKey}>
                  <h3 className="font-heading text-lg mb-4">
                    {t(`footer.sections.${sectionKey}`)}
                  </h3>
                  <ul className="space-y-3">
                    {items.map(item => (
                      <li key={item.name}>
                        {item.external ? (
                          <a
                            href={item.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lavender"
                          >
                            {item.name}
                          </a>
                        ) : (
                          <Link
                            href={item.href}
                            className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lavender"
                          >
                            {item.name}
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )
            )}
          </div>

          <div className="mt-12 pt-8 border-t border-white/10">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-4">
                <span className="font-heading text-2xl font-bold">MADFAM</span>
                <span className="text-white/50">•</span>
                <p className="text-white/70">{t('footer.tagline')}</p>
              </div>

              <div className="flex items-center gap-6">
                {social.map(item => (
                  <a
                    key={item.name}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/70 hover:text-white transition-colors"
                    aria-label={item.name}
                  >
                    {item.icon === 'in' && (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                      </svg>
                    )}
                    {item.icon === 'X' && (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                    )}
                    {item.icon === 'ig' && (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                      </svg>
                    )}
                    {item.icon === 'fb' && (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                    )}
                    {item.icon === 'tt' && (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                      </svg>
                    )}
                    {item.icon === 'gh' && (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                      </svg>
                    )}
                  </a>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-white/10">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-white/50">
                <p>
                  © {currentYear} MADFAM. {t('common.footer.rights')}
                </p>
                <div className="flex gap-6">
                  <Link
                    href={`/${locale}/privacy`}
                    className="hover:text-white/70 transition-colors"
                  >
                    {t('common.footer.privacy')}
                  </Link>
                  <Link href={`/${locale}/terms`} className="hover:text-white/70 transition-colors">
                    {t('common.footer.terms')}
                  </Link>
                  <Link
                    href={`/${locale}/cookies`}
                    className="hover:text-white/70 transition-colors"
                  >
                    {t('footer.cookies')}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </footer>
  );
}
