'use client';

import { getLocalizedUrl, type Locale } from '@madfam/i18n';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { useState, useEffect, useCallback, useRef } from 'react';
import { DarkModeToggle } from './DarkModeToggle';
import { LanguageSwitcher } from './LanguageSwitcher';
import { cn } from '@/components/ui';

interface NavItem {
  name: string;
  href?: string;
  highlight?: boolean;
  dropdown?: DropdownSection[];
}

interface DropdownSection {
  title: string;
  items: {
    name: string;
    href: string;
    description?: string;
    icon?: string;
  }[];
}

export function Navbar() {
  const t = useTranslations('common.nav');
  const tCommon = useTranslations('common');
  const locale = useLocale() as Locale;

  // State management
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [logoScale, setLogoScale] = useState(1);

  // Refs
  const lastScrollY = useRef(0);
  const dropdownTimeout = useRef<NodeJS.Timeout | undefined>(undefined);

  // Scroll handling with hide/show behavior
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, 'change', latest => {
    const currentScrollY = latest;
    const scrollThreshold = 80;
    const hideThreshold = 300;

    // Update scroll state
    setIsScrolled(currentScrollY > scrollThreshold);

    // Logo scaling based on scroll
    const scale = Math.max(0.8, 1 - currentScrollY / 500);
    setLogoScale(scale);

    // Hide/show navbar on scroll
    if (currentScrollY > hideThreshold) {
      if (currentScrollY > lastScrollY.current && currentScrollY - lastScrollY.current > 10) {
        setIsHidden(true);
      } else if (lastScrollY.current - currentScrollY > 10) {
        setIsHidden(false);
      }
    } else {
      setIsHidden(false);
    }

    lastScrollY.current = currentScrollY;
  });

  // Navigation structure - organized and hierarchical
  const primaryNavigation: NavItem[] = [
    {
      name: t('solutions') || 'Solutions',
      dropdown: [
        {
          title: t('businessSolutions') || 'Business Units',
          items: [
            {
              name: 'MADFAM Co-Labs',
              href: getLocalizedUrl('solutions.colabs', locale),
              description: 'Collaborative innovation spaces',
              icon: '🤝',
            },
          ],
        },
        {
          title: t('programs') || 'Programs',
          items: [
            {
              name: t('programs') || 'All Programs',
              href: getLocalizedUrl('programs', locale),
              description: 'Transformation initiatives',
              icon: '📈',
            },
          ],
        },
      ],
    },
    {
      name: t('products') || 'Products',
      href: getLocalizedUrl('products', locale),
    },
    {
      name: t('impact') || 'Impact',
      href: getLocalizedUrl('impact', locale),
      highlight: true,
    },
    {
      name: t('company') || 'Company',
      dropdown: [
        {
          title: '',
          items: [
            {
              name: t('about') || 'About Us',
              href: getLocalizedUrl('about', locale),
              icon: '🏢',
            },
            {
              name: t('caseStudies') || 'Showcase',
              href: `/${locale}/case-studies`,
              icon: '✨',
            },
            {
              name: t('careers') || 'Careers',
              href: getLocalizedUrl('careers', locale),
              icon: '💼',
            },
            {
              name: t('contact') || 'Contact',
              href: getLocalizedUrl('contact', locale),
              icon: '📧',
            },
          ],
        },
      ],
    },
  ];

  // Dropdown handlers
  const handleDropdownEnter = useCallback((name: string) => {
    if (dropdownTimeout.current) {
      clearTimeout(dropdownTimeout.current);
    }
    setActiveDropdown(name);
  }, []);

  const handleDropdownLeave = useCallback(() => {
    dropdownTimeout.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 150);
  }, []);

  // Keyboard navigation handlers
  const handleDropdownKeyDown = useCallback(
    (event: React.KeyboardEvent, itemName: string) => {
      switch (event.key) {
        case 'Enter':
        case ' ':
          event.preventDefault();
          setActiveDropdown(prev => (prev === itemName ? null : itemName));
          break;
        case 'Escape':
          event.preventDefault();
          setActiveDropdown(null);
          break;
        case 'ArrowDown':
          event.preventDefault();
          if (activeDropdown !== itemName) {
            setActiveDropdown(itemName);
          }
          break;
        case 'ArrowUp':
          event.preventDefault();
          setActiveDropdown(null);
          break;
      }
    },
    [activeDropdown]
  );

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [locale]);

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled
          ? 'bg-white/95 dark:bg-obsidian/95 backdrop-blur-lg shadow-sm'
          : 'bg-transparent',
        isHidden && 'transform -translate-y-full'
      )}
      style={{
        transform: isHidden ? 'translateY(-100%)' : 'none',
      }}
    >
      {/* Progress indicator */}
      <div
        className={cn(
          'absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-sun via-lavender to-leaf transform origin-left transition-transform duration-300',
          isScrolled ? 'scale-x-100' : 'scale-x-0'
        )}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href={`/${locale}`} className="flex items-center gap-3 group relative z-10">
            <div className="absolute -inset-3 bg-gradient-to-r from-sun/20 via-lavender/20 to-leaf/20 rounded-full opacity-0 group-hover:opacity-100 blur-xl transition-all duration-500" />
            <div className="relative" style={{ transform: `scale(${logoScale})` }}>
              <Image
                src="/assets/brand/madfam-logo.svg"
                alt="MADFAM"
                width={48}
                height={48}
                priority
                className="w-12 h-12 transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <span
              className={cn(
                'font-heading text-2xl font-bold bg-gradient-to-r from-obsidian to-obsidian/80 dark:from-pearl dark:to-pearl/80 bg-clip-text text-transparent',
                isScrolled && 'text-xl'
              )}
            >
              MADFAM
            </span>
          </Link>

          {/* Desktop Navigation - More spacious and hierarchical */}
          <div className="hidden xl:flex items-center gap-12">
            <div className="flex items-center gap-10">
              {primaryNavigation.map(item => (
                <div key={item.name} className="relative">
                  {item.dropdown ? (
                    <div
                      onMouseEnter={() => handleDropdownEnter(item.name)}
                      onMouseLeave={handleDropdownLeave}
                    >
                      <button
                        className="relative py-2 text-base font-semibold transition-all duration-300 flex items-center gap-1.5 text-obsidian/90 dark:text-pearl/90 hover:text-obsidian dark:hover:text-pearl"
                        onClick={() =>
                          setActiveDropdown(prev => (prev === item.name ? null : item.name))
                        }
                        onKeyDown={e => handleDropdownKeyDown(e, item.name)}
                        aria-expanded={activeDropdown === item.name}
                        aria-haspopup="true"
                        aria-label={`${item.name} menu`}
                      >
                        {item.name}
                        <svg
                          className={cn(
                            'w-4 h-4 transition-transform duration-200',
                            activeDropdown === item.name && 'rotate-180'
                          )}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>

                      {/* Dropdown Menu */}
                      <AnimatePresence>
                        {activeDropdown === item.name && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="absolute top-full left-0 mt-3 min-w-[320px] bg-white dark:bg-obsidian rounded-xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden"
                            onMouseEnter={() => handleDropdownEnter(item.name)}
                            onMouseLeave={handleDropdownLeave}
                            role="menu"
                            aria-orientation="vertical"
                          >
                            {item.dropdown.map(section => (
                              <div key={section.title} className="p-4">
                                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                                  {section.title}
                                </h3>
                                {section.items.map(subItem => (
                                  <Link
                                    key={subItem.name}
                                    href={subItem.href}
                                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                                    role="menuitem"
                                  >
                                    {subItem.icon && (
                                      <span className="text-xl">{subItem.icon}</span>
                                    )}
                                    <div>
                                      <div className="font-medium text-obsidian dark:text-pearl">
                                        {subItem.name}
                                      </div>
                                      {subItem.description && (
                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                          {subItem.description}
                                        </div>
                                      )}
                                    </div>
                                  </Link>
                                ))}
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <Link
                      href={item.href || '#'}
                      className={cn(
                        'relative py-2 text-base font-semibold transition-all duration-300',
                        item.highlight
                          ? 'text-leaf dark:text-sun'
                          : 'text-obsidian/90 dark:text-pearl/90 hover:text-obsidian dark:hover:text-pearl'
                      )}
                    >
                      {item.name}
                      {item.highlight && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-leaf dark:bg-sun rounded-full animate-pulse" />
                      )}
                      <span className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-sun to-lavender transform scale-x-0 hover:scale-x-100 transition-transform duration-300 origin-left" />
                    </Link>
                  )}
                </div>
              ))}
            </div>

            {/* Right side actions - Simplified and spacious */}
            <div className="flex items-center gap-6">
              {/* Utility actions */}
              <div className="flex items-center gap-3">
                <LanguageSwitcher />
                <DarkModeToggle />
              </div>

              {/* CTA buttons */}
              <div className="flex items-center gap-3">
                <Link
                  href={`/${locale}/assessment`}
                  className="px-4 py-2 text-sm font-medium text-obsidian dark:text-pearl hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200"
                >
                  {tCommon('aiAssessment')}
                </Link>
                <Link
                  href={getLocalizedUrl('contact', locale)}
                  className="relative px-5 py-2.5 rounded-lg font-semibold text-sm overflow-hidden group bg-gradient-to-r from-leaf to-sun text-white hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                >
                  <span className="relative z-10">{t('getStarted') || 'Get Started'}</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
                </Link>
              </div>
            </div>
          </div>

          {/* Mobile menu button */}
          <button
            className="xl:hidden relative w-12 h-12 flex items-center justify-center rounded-xl hover:bg-obsidian/5 dark:hover:bg-pearl/5 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <div className="w-6 h-5 relative flex flex-col justify-between">
              <span
                className={cn(
                  'w-full h-0.5 bg-obsidian dark:bg-pearl rounded-full origin-left transition-all',
                  mobileMenuOpen && 'rotate-45 translate-y-[9px]'
                )}
              />
              <span
                className={cn(
                  'w-full h-0.5 bg-obsidian dark:bg-pearl rounded-full transition-all',
                  mobileMenuOpen && 'opacity-0'
                )}
              />
              <span
                className={cn(
                  'w-full h-0.5 bg-obsidian dark:bg-pearl rounded-full origin-left transition-all',
                  mobileMenuOpen && '-rotate-45 -translate-y-[9px]'
                )}
              />
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="xl:hidden bg-white dark:bg-obsidian border-t border-gray-100 dark:border-gray-800"
          >
            <div className="px-4 py-6 space-y-6">
              {primaryNavigation.map(item => (
                <div key={item.name}>
                  {item.dropdown ? (
                    <div>
                      <div className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                        {item.name}
                      </div>
                      {item.dropdown.map(section =>
                        section.items.map(subItem => (
                          <Link
                            key={subItem.name}
                            href={subItem.href}
                            className="flex items-center gap-3 py-2 text-base text-obsidian/70 dark:text-pearl/70"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            {subItem.icon && <span>{subItem.icon}</span>}
                            <div>
                              <div className="font-medium">{subItem.name}</div>
                              {subItem.description && (
                                <div className="text-xs text-gray-500">{subItem.description}</div>
                              )}
                            </div>
                          </Link>
                        ))
                      )}
                    </div>
                  ) : (
                    <Link
                      href={item.href || '#'}
                      className="block py-2 text-base font-medium text-obsidian/70 dark:text-pearl/70"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                  )}
                </div>
              ))}

              {/* Mobile Actions */}
              <div className="pt-6 border-t border-gray-100 dark:border-gray-800 space-y-4">
                <Link
                  href={`/${locale}/assessment`}
                  className="block w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 rounded-lg text-center font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {tCommon('aiAssessment')}
                </Link>
                <Link
                  href={getLocalizedUrl('contact', locale)}
                  className="block w-full px-4 py-3 bg-gradient-to-r from-lavender to-sun text-white rounded-lg text-center font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('contact')}
                </Link>
                <div className="flex items-center justify-between px-4">
                  <LanguageSwitcher />
                  <DarkModeToggle />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

// Export LuxuryNavbar as an alias for backward compatibility
export { Navbar as LuxuryNavbar };
