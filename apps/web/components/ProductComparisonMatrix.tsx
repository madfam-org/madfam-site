'use client';

import { useState, useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import {
  ArrowRightIcon,
  CheckIcon,
  XMarkIcon,
  ArrowDownTrayIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { Button, Container, Heading } from '@/components/ui';
import { Badge } from '@/components/corporate/Badge';

// Product data types
interface ProductFeature {
  name: string;
  dhanam: boolean | string;
  forgeSight: boolean | string;
  penny: boolean | string;
  cotiza: boolean | string;
}

interface FilterState {
  industry: string;
  companySize: string;
  budget: string;
  useCase: string;
}

// Product definitions
const products = [
  {
    id: 'dhanam',
    name: 'Dhanam',
    tagline: 'Financial Wellness Platform',
    color: 'blue',
    url: 'https://www.dhan.am',
    demoUrl: '/demo/dhanam',
    badge: 'MADFAM',
    icon: '💰',
  },
  {
    id: 'forgeSight',
    name: 'Forge Sight',
    tagline: 'Manufacturing Intelligence',
    color: 'green',
    url: 'https://www.forgesight.quest',
    demoUrl: '/demo/forge-sight',
    badge: 'MADFAM',
    icon: '🏭',
  },
  {
    id: 'penny',
    name: 'PENNY',
    tagline: 'AI Assistant (In Development)',
    color: 'purple',
    url: '/products',
    badge: 'MADFAM',
    icon: '🤖',
  },
  {
    id: 'cotiza',
    name: 'Cotiza Studio',
    tagline: 'Quoting & Estimation',
    color: 'amber',
    url: 'https://cotiza.studio',
    badge: 'MADFAM',
    icon: '📊',
  },
];

// Filter options
const industries = [
  { value: '', label: 'All Industries' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'finance', label: 'Finance & Banking' },
  { value: 'education', label: 'Education' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'retail', label: 'Retail & E-commerce' },
  { value: 'services', label: 'Professional Services' },
];

const companySizes = [
  { value: '', label: 'All Sizes' },
  { value: 'startup', label: '1-50 employees' },
  { value: 'smb', label: '51-200 employees' },
  { value: 'midmarket', label: '201-500 employees' },
  { value: 'enterprise', label: '500+ employees' },
];

const budgets = [
  { value: '', label: 'All Budgets' },
  { value: 'starter', label: 'Under $10k/year' },
  { value: 'growth', label: '$10k-$50k/year' },
  { value: 'scale', label: '$50k-$100k/year' },
  { value: 'enterprise', label: '$100k+/year' },
];

const useCases = [
  { value: '', label: 'All Use Cases' },
  { value: 'employee-wellness', label: 'Employee Financial Wellness' },
  { value: 'pricing-optimization', label: 'Pricing & Quoting' },
  { value: 'customer-service', label: 'Customer Service Automation' },
  { value: 'process-automation', label: 'Process Automation' },
  { value: 'data-analytics', label: 'Data & Analytics' },
];

// Feature categories
const featureCategories = [
  {
    name: 'Core Capabilities',
    features: [
      { name: 'AI-Powered Analytics', dhanam: true, forgeSight: true, penny: true, cotiza: true },
      { name: 'Real-time Dashboard', dhanam: true, forgeSight: true, penny: false, cotiza: true },
      { name: 'Mobile App', dhanam: true, forgeSight: false, penny: true, cotiza: false },
      { name: 'API Access', dhanam: true, forgeSight: true, penny: true, cotiza: true },
      {
        name: 'White-label Option',
        dhanam: 'Enterprise',
        forgeSight: 'Pro+',
        penny: false,
        cotiza: 'Pro+',
      },
    ],
  },
  {
    name: 'Integration',
    features: [
      { name: 'SSO/SAML', dhanam: true, forgeSight: true, penny: true, cotiza: true },
      { name: 'ERP Integration', dhanam: false, forgeSight: true, penny: false, cotiza: true },
      { name: 'HR Systems', dhanam: true, forgeSight: false, penny: false, cotiza: false },
      { name: 'Payment Gateways', dhanam: true, forgeSight: true, penny: false, cotiza: true },
      { name: 'Custom Webhooks', dhanam: true, forgeSight: true, penny: true, cotiza: true },
    ],
  },
  {
    name: 'Support & SLA',
    features: [
      { name: 'Email Support', dhanam: true, forgeSight: true, penny: true, cotiza: true },
      { name: 'Chat Support', dhanam: 'Pro+', forgeSight: 'Pro+', penny: true, cotiza: 'Pro+' },
      {
        name: 'Dedicated CSM',
        dhanam: 'Enterprise',
        forgeSight: 'Enterprise',
        penny: 'Enterprise',
        cotiza: 'Enterprise',
      },
      { name: '99.9% SLA', dhanam: 'Pro+', forgeSight: 'Pro+', penny: 'Pro+', cotiza: 'Pro+' },
      {
        name: 'On-premise Option',
        dhanam: 'Enterprise',
        forgeSight: 'Enterprise',
        penny: false,
        cotiza: 'Enterprise',
      },
    ],
  },
  {
    name: 'Compliance & Security',
    features: [
      { name: 'SOC 2 Type II', dhanam: true, forgeSight: true, penny: true, cotiza: true },
      { name: 'GDPR Compliant', dhanam: true, forgeSight: true, penny: true, cotiza: true },
      { name: 'HIPAA Ready', dhanam: 'Add-on', forgeSight: false, penny: false, cotiza: false },
      {
        name: 'Data Residency',
        dhanam: 'LATAM/US',
        forgeSight: 'LATAM/US',
        penny: 'US',
        cotiza: 'LATAM/US',
      },
      { name: 'Audit Logs', dhanam: true, forgeSight: true, penny: true, cotiza: true },
    ],
  },
];

// Pricing tiers
const pricingTiers = {
  dhanam: {
    starter: { monthly: 99, yearly: 990 },
    pro: { monthly: 299, yearly: 2990 },
    enterprise: { monthly: 'Custom', yearly: 'Custom' },
  },
  forgeSight: {
    starter: { monthly: 149, yearly: 1490 },
    pro: { monthly: 399, yearly: 3990 },
    enterprise: { monthly: 'Custom', yearly: 'Custom' },
  },
  penny: {
    starter: { monthly: 'TBD', yearly: 'TBD' },
    pro: { monthly: 'TBD', yearly: 'TBD' },
    enterprise: { monthly: 'TBD', yearly: 'TBD' },
  },
  cotiza: {
    starter: { monthly: 79, yearly: 790 },
    pro: { monthly: 199, yearly: 1990 },
    enterprise: { monthly: 'Custom', yearly: 'Custom' },
  },
};

// Recommendation logic
function getRecommendation(filters: FilterState): string | null {
  const { industry, budget, useCase } = filters;

  // Use case based recommendations
  if (useCase === 'employee-wellness') return 'dhanam';
  if (useCase === 'pricing-optimization') return 'forgeSight';
  if (useCase === 'customer-service') return 'penny';
  if (useCase === 'process-automation') return 'cotiza';

  // Industry based recommendations
  if (industry === 'manufacturing') return 'forgeSight';
  if (industry === 'finance') return 'dhanam';
  if (industry === 'retail') return 'penny';

  // Budget based recommendations
  if (budget === 'starter') return 'penny';
  if (budget === 'enterprise') return 'forgeSight';

  return null;
}

export function ProductComparisonMatrix() {
  const t = useTranslations('compare');
  const locale = useLocale();

  const [filters, setFilters] = useState<FilterState>({
    industry: '',
    companySize: '',
    budget: '',
    useCase: '',
  });

  const [selectedProducts, setSelectedProducts] = useState<string[]>([
    'dhanam',
    'forgeSight',
    'penny',
    'cotiza',
  ]);

  const [pricingPeriod, setPricingPeriod] = useState<'monthly' | 'yearly'>('yearly');

  const recommendation = useMemo(() => getRecommendation(filters), [filters]);

  const visibleProducts = products.filter(p => selectedProducts.includes(p.id));

  const toggleProduct = (productId: string) => {
    if (selectedProducts.includes(productId)) {
      if (selectedProducts.length > 1) {
        setSelectedProducts(selectedProducts.filter(id => id !== productId));
      }
    } else {
      setSelectedProducts([...selectedProducts, productId]);
    }
  };

  const updateFilter = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const renderFeatureValue = (value: boolean | string) => {
    if (value === true) {
      return (
        <div className="flex justify-center">
          <CheckIcon className="w-5 h-5 text-green-600" />
        </div>
      );
    }
    if (value === false) {
      return (
        <div className="flex justify-center">
          <XMarkIcon className="w-5 h-5 text-neutral-300" />
        </div>
      );
    }
    return <span className="text-sm text-neutral-600 font-medium">{value}</span>;
  };

  return (
    <main className="min-h-screen bg-neutral-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 py-16">
        <Container>
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="by-madfam" className="mb-4 text-white/80 bg-white/10 border-white/20">
              Product Comparison
            </Badge>
            <Heading level={1} className="text-white mb-4">
              {t('hero.title', { defaultValue: 'Find Your Perfect Solution' })}
            </Heading>
            <p className="text-xl text-white/80 max-w-2xl mx-auto">
              {t('hero.subtitle', {
                defaultValue:
                  'Compare our products side-by-side to find the best fit for your business needs',
              })}
            </p>
          </div>
        </Container>
      </section>

      {/* Filters Section */}
      <section className="py-8 bg-white border-b border-neutral-200 sticky top-0 z-20">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Industry</label>
              <select
                value={filters.industry}
                onChange={e => updateFilter('industry', e.target.value)}
                className="w-full rounded-lg border-neutral-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                {industries.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Company Size
              </label>
              <select
                value={filters.companySize}
                onChange={e => updateFilter('companySize', e.target.value)}
                className="w-full rounded-lg border-neutral-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                {companySizes.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Budget</label>
              <select
                value={filters.budget}
                onChange={e => updateFilter('budget', e.target.value)}
                className="w-full rounded-lg border-neutral-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                {budgets.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Use Case</label>
              <select
                value={filters.useCase}
                onChange={e => updateFilter('useCase', e.target.value)}
                className="w-full rounded-lg border-neutral-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                {useCases.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Product toggles */}
          <div className="mt-6 flex flex-wrap gap-2">
            <span className="text-sm text-neutral-600 self-center mr-2">Show:</span>
            {products.map(product => (
              <button
                key={product.id}
                onClick={() => toggleProduct(product.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  selectedProducts.includes(product.id)
                    ? 'bg-neutral-900 text-white'
                    : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
                }`}
              >
                {product.icon} {product.name}
              </button>
            ))}
          </div>
        </Container>
      </section>

      {/* Recommendation Banner */}
      {recommendation && (
        <section className="py-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-blue-100">
          <Container>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <SparklesIcon className="w-6 h-6 text-blue-600" />
                <div>
                  <p className="text-sm text-neutral-600">Based on your selections, we recommend</p>
                  <p className="font-semibold text-neutral-900">
                    {products.find(p => p.id === recommendation)?.name} -{' '}
                    {products.find(p => p.id === recommendation)?.tagline}
                  </p>
                </div>
              </div>
              {products.find(p => p.id === recommendation)?.demoUrl && (
                <Link href={`/${locale}${products.find(p => p.id === recommendation)?.demoUrl}`}>
                  <Button size="sm">
                    Try Demo
                    <ArrowRightIcon className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              )}
            </div>
          </Container>
        </section>
      )}

      {/* Comparison Table */}
      <section className="py-12">
        <Container>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              {/* Product Headers */}
              <thead>
                <tr>
                  <th className="w-1/5 p-4 text-left bg-white" />
                  {visibleProducts.map(product => (
                    <th
                      key={product.id}
                      className={`w-1/5 p-4 text-center bg-white border-b-4 ${
                        recommendation === product.id ? 'border-blue-500' : 'border-neutral-200'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-3xl">{product.icon}</span>
                        <h3 className="font-bold text-lg text-neutral-900">{product.name}</h3>
                        <Badge variant="by-madfam" className="text-xs">
                          {product.badge}
                        </Badge>
                        <p className="text-sm text-neutral-600">{product.tagline}</p>
                        {recommendation === product.id && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                            Recommended
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {/* Pricing Row */}
                <tr className="bg-neutral-50">
                  <td className="p-4 font-semibold text-neutral-900">
                    <div className="flex items-center gap-2">
                      Starting Price
                      <div className="flex gap-1 text-xs">
                        <button
                          onClick={() => setPricingPeriod('monthly')}
                          className={`px-2 py-0.5 rounded ${
                            pricingPeriod === 'monthly'
                              ? 'bg-neutral-900 text-white'
                              : 'bg-neutral-200 text-neutral-600'
                          }`}
                        >
                          Monthly
                        </button>
                        <button
                          onClick={() => setPricingPeriod('yearly')}
                          className={`px-2 py-0.5 rounded ${
                            pricingPeriod === 'yearly'
                              ? 'bg-neutral-900 text-white'
                              : 'bg-neutral-200 text-neutral-600'
                          }`}
                        >
                          Yearly
                        </button>
                      </div>
                    </div>
                  </td>
                  {visibleProducts.map(product => {
                    const price =
                      pricingTiers[product.id as keyof typeof pricingTiers]?.starter[pricingPeriod];
                    return (
                      <td key={product.id} className="p-4 text-center">
                        <div className="text-2xl font-bold text-neutral-900">
                          {typeof price === 'number' ? `$${price}` : price}
                        </div>
                        <div className="text-sm text-neutral-600">
                          /{pricingPeriod === 'monthly' ? 'mo' : 'yr'}
                        </div>
                        {pricingPeriod === 'yearly' && typeof price === 'number' && (
                          <div className="text-xs text-green-600 mt-1">Save 17%</div>
                        )}
                      </td>
                    );
                  })}
                </tr>

                {/* Feature Categories */}
                {featureCategories.map(category => (
                  <>
                    <tr key={`header-${category.name}`} className="bg-neutral-100">
                      <td
                        colSpan={visibleProducts.length + 1}
                        className="p-3 font-semibold text-neutral-700"
                      >
                        {category.name}
                      </td>
                    </tr>
                    {category.features.map(feature => (
                      <tr key={feature.name} className="bg-white border-b border-neutral-100">
                        <td className="p-4 text-sm text-neutral-700">{feature.name}</td>
                        {visibleProducts.map(product => (
                          <td key={`${feature.name}-${product.id}`} className="p-4 text-center">
                            {renderFeatureValue(
                              feature[product.id as keyof ProductFeature] as boolean | string
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </>
                ))}

                {/* CTA Row */}
                <tr className="bg-white">
                  <td className="p-4" />
                  {visibleProducts.map(product => (
                    <td key={`cta-${product.id}`} className="p-4 text-center">
                      <div className="flex flex-col gap-2">
                        {product.demoUrl && (
                          <Link href={`/${locale}${product.demoUrl}`}>
                            <Button className="w-full" size="sm">
                              Try Demo
                            </Button>
                          </Link>
                        )}
                        <Link
                          href={product.url}
                          target={product.url.startsWith('http') ? '_blank' : undefined}
                        >
                          <Button variant="outline" className="w-full" size="sm">
                            Learn More
                          </Button>
                        </Link>
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Download Comparison */}
          <div className="mt-8 text-center">
            <Button variant="outline" size="lg">
              <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
              Download Comparison (PDF)
            </Button>
          </div>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-neutral-900">
        <Container>
          <div className="max-w-3xl mx-auto text-center">
            <Heading level={2} className="text-white mb-4">
              Still not sure which solution is right for you?
            </Heading>
            <p className="text-lg text-white/80 mb-8">
              Take our 3-minute AI assessment to get personalized recommendations based on your
              specific needs and goals.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href={`/${locale}/assessment`}>
                <Button size="lg" variant="secondary">
                  Start AI Assessment
                  <ArrowRightIcon className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href={`/${locale}/contact`}>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white/10"
                >
                  Talk to an Expert
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
