'use client';

import { type Locale } from '@madfam/i18n';
import { motion, AnimatePresence } from 'framer-motion';
import { Search as SearchIcon, X, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

interface SearchResult {
  id: string;
  title: string;
  description: string;
  type: 'service' | 'product' | 'page' | 'article';
  url: string;
}

export function Search() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const locale = useLocale() as Locale;
  const t = useTranslations('search');

  // Mock search data - in production, this would come from an API
  const searchableContent: SearchResult[] = useMemo(
    () => [
      // Products
      {
        id: 'enclii',
        title: 'Enclii',
        description:
          locale === 'en'
            ? 'Sovereign cloud platform — GitOps-native PaaS built on Kubernetes'
            : locale === 'pt'
              ? 'Plataforma de nuvem soberana — PaaS GitOps-nativa construída sobre Kubernetes'
              : 'Plataforma de nube soberana — PaaS GitOps-nativa construida sobre Kubernetes',
        type: 'product' as const,
        url: `/${locale}/${locale === 'es' ? 'productos' : locale === 'pt' ? 'produtos' : 'products'}#enclii`,
      },
      {
        id: 'janua',
        title: 'Janua',
        description:
          locale === 'en'
            ? 'Self-hosted identity platform with enterprise SSO, MFA, and Passkeys'
            : locale === 'pt'
              ? 'Plataforma de identidade auto-hospedada com SSO empresarial, MFA e Passkeys'
              : 'Plataforma de identidad auto-hospedada con SSO empresarial, MFA y Passkeys',
        type: 'product' as const,
        url: `/${locale}/${locale === 'es' ? 'productos' : locale === 'pt' ? 'produtos' : 'products'}#janua`,
      },
      {
        id: 'penny',
        title: 'Penny',
        description:
          locale === 'en'
            ? 'AI-powered process automation assistant'
            : locale === 'pt'
              ? 'Assistente de automação de processos com IA'
              : 'Asistente de automatización de procesos con IA',
        type: 'product' as const,
        url: `/${locale}/${locale === 'es' ? 'productos' : locale === 'pt' ? 'produtos' : 'products'}#penny`,
      },
      // Pages
      {
        id: 'about',
        title:
          locale === 'en' ? 'About MADFAM' : locale === 'pt' ? 'Sobre MADFAM' : 'Acerca de MADFAM',
        description:
          locale === 'en'
            ? 'Learn about our mission, vision and team'
            : locale === 'pt'
              ? 'Conheça nossa missão, visão e equipe'
              : 'Conoce nuestra misión, visión y equipo',
        type: 'page' as const,
        url: `/${locale}/${locale === 'es' ? 'nosotros' : locale === 'pt' ? 'sobre' : 'about'}`,
      },
      {
        id: 'contact',
        title: locale === 'en' ? 'Contact' : locale === 'pt' ? 'Contato' : 'Contacto',
        description:
          locale === 'en'
            ? 'Get in touch with our team'
            : locale === 'pt'
              ? 'Entre em contato com nossa equipe'
              : 'Ponte en contacto con nuestro equipo',
        type: 'page' as const,
        url: `/${locale}/${locale === 'es' ? 'contacto' : locale === 'pt' ? 'contato' : 'contact'}`,
      },
      {
        id: 'assessment',
        title:
          locale === 'en'
            ? 'AI Assessment'
            : locale === 'pt'
              ? 'Avaliação de IA'
              : 'Evaluación de IA',
        description:
          locale === 'en'
            ? 'Discover the AI potential for your business'
            : locale === 'pt'
              ? 'Descubra o potencial de IA para seu negócio'
              : 'Descubre el potencial de IA para tu negocio',
        type: 'page' as const,
        url: `/${locale}/${locale === 'es' ? 'evaluacion' : locale === 'pt' ? 'avaliacao' : 'assessment'}`,
      },
      {
        id: 'calculator',
        title:
          locale === 'en'
            ? 'ROI Calculator'
            : locale === 'pt'
              ? 'Calculadora de ROI'
              : 'Calculadora de ROI',
        description:
          locale === 'en'
            ? 'Calculate the return on investment of our services'
            : locale === 'pt'
              ? 'Calcule o retorno do investimento de nossos serviços'
              : 'Calcula el retorno de inversión de nuestros servicios',
        type: 'page' as const,
        url: `/${locale}/${locale === 'es' ? 'calculadora' : locale === 'pt' ? 'calculadora' : 'calculator'}`,
      },
      {
        id: 'estimator',
        title:
          locale === 'en'
            ? 'Project Estimator'
            : locale === 'pt'
              ? 'Estimador de Projetos'
              : 'Estimador de Proyectos',
        description:
          locale === 'en'
            ? 'Get an instant quote for your project'
            : locale === 'pt'
              ? 'Obtenha uma cotação instantânea para seu projeto'
              : 'Obtén una cotización instantánea para tu proyecto',
        type: 'page' as const,
        url: `/${locale}/${locale === 'es' ? 'estimador' : locale === 'pt' ? 'estimador' : 'estimator'}`,
      },
    ],
    [locale]
  );

  // Handle search
  const performSearch = useCallback(
    (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([]);
        return;
      }

      setLoading(true);

      // Simulate API delay
      setTimeout(() => {
        const filtered = searchableContent.filter(
          item =>
            item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.description.toLowerCase().includes(searchQuery.toLowerCase())
        );

        setResults(filtered);
        setLoading(false);
      }, 300);
    },
    [searchableContent]
  );

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, performSearch]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to open search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }

      // Escape to close
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus input when opening
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleResultClick = (url: string) => {
    router.push(url);
    setIsOpen(false);
    setQuery('');
  };

  const getTypeLabel = (type: SearchResult['type']) => {
    const labels = {
      service: locale === 'en' ? 'Service' : locale === 'pt' ? 'Serviço' : 'Servicio',
      product: locale === 'en' ? 'Product' : locale === 'pt' ? 'Produto' : 'Producto',
      page: locale === 'en' ? 'Page' : locale === 'pt' ? 'Página' : 'Página',
      article: locale === 'en' ? 'Article' : locale === 'pt' ? 'Artigo' : 'Artículo',
    };
    return labels[type];
  };

  const getTypeColor = (type: SearchResult['type']) => {
    const colors = {
      service: 'text-sun bg-sun/10',
      product: 'text-lavender bg-lavender/10',
      page: 'text-leaf bg-leaf/10',
      article: 'text-obsidian bg-obsidian/10',
    };
    return colors[type];
  };

  return (
    <>
      {/* Search Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
        aria-label="Search"
      >
        <SearchIcon className="w-4 h-4" />
        <span className="hidden sm:inline">{t('button')}</span>
        <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-xs font-sans bg-gray-100 dark:bg-gray-800 rounded">
          <span>⌘</span>K
        </kbd>
      </button>

      {/* Search Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              ref={searchRef}
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* Search Input */}
              <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-800">
                <SearchIcon className="w-5 h-5 text-gray-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder={t('placeholder')}
                  className="flex-1 bg-transparent outline-none text-lg placeholder:text-gray-400"
                />
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search Results */}
              <div className="max-h-[400px] overflow-y-auto">
                {loading ? (
                  <div className="p-8 text-center text-gray-500">{t('searching')}</div>
                ) : results.length > 0 ? (
                  <div className="p-2">
                    {results.map(result => (
                      <button
                        key={result.id}
                        onClick={() => handleResultClick(result.url)}
                        className="w-full p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left group"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span
                                className={`px-2 py-0.5 text-xs font-medium rounded-full ${getTypeColor(result.type)}`}
                              >
                                {getTypeLabel(result.type)}
                              </span>
                              <h3 className="font-medium text-gray-900 dark:text-white">
                                {result.title}
                              </h3>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                              {result.description}
                            </p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 mt-1" />
                        </div>
                      </button>
                    ))}
                  </div>
                ) : query.trim() ? (
                  <div className="p-8 text-center">
                    <p className="text-gray-500 dark:text-gray-400">
                      {t('noResultsFor', { query })}
                    </p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                      {t('tryDifferentTerms')}
                    </p>
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-400 dark:text-gray-500">
                    <p>{t('startTyping')}</p>
                    <div className="flex items-center justify-center gap-4 mt-4 text-sm">
                      <span className="flex items-center gap-1">
                        <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                          ↑↓
                        </kbd>
                        {t('navigate')}
                      </span>
                      <span className="flex items-center gap-1">
                        <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                          Enter
                        </kbd>
                        {t('select')}
                      </span>
                      <span className="flex items-center gap-1">
                        <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                          Esc
                        </kbd>
                        {t('close')}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
