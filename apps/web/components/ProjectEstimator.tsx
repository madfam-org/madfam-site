'use client';

import { motion } from 'framer-motion';
import { Calculator, ChevronLeft, DollarSign, Clock, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Button } from '@/components/ui';
import { useCurrencyFormatter } from '@/lib/formatting';

type TranslationFunction = (key: string) => string;

interface ProjectRequirements {
  projectType: string;
  complexity: 'simple' | 'medium' | 'complex';
  features: string[];
  timeline: 'urgent' | 'normal' | 'flexible';
  teamSize: 'small' | 'medium' | 'large';
  industry: string;
}

interface ProjectEstimate {
  estimatedCost: { min: number; max: number };
  estimatedDuration: { min: number; max: number };
  recommendedTeam: string[];
  suggestedFeatures: string[];
}

const getProjectTypes = (t: TranslationFunction) => [
  { id: 'web-app', name: t('projectTypes.webApp'), icon: '🌐' },
  { id: 'mobile-app', name: t('projectTypes.mobileApp'), icon: '📱' },
  { id: 'ecommerce', name: t('projectTypes.ecommerce'), icon: '🛒' },
  { id: 'automation', name: t('projectTypes.automation'), icon: '🤖' },
  { id: 'consulting', name: t('projectTypes.consulting'), icon: '💡' },
  { id: 'custom', name: t('projectTypes.custom'), icon: '🎯' },
];

const getFeatures = (t: TranslationFunction) => [
  { id: 'ai-integration', name: t('features.aiIntegration'), category: 'tech' },
  { id: 'real-time', name: t('features.realTime'), category: 'tech' },
  { id: 'payment', name: t('features.payment'), category: 'business' },
  { id: 'analytics', name: t('features.analytics'), category: 'business' },
  { id: 'multi-language', name: t('features.multiLanguage'), category: 'ux' },
  { id: 'offline', name: t('features.offline'), category: 'ux' },
  { id: 'notifications', name: t('features.notifications'), category: 'engagement' },
  { id: 'social-login', name: t('features.socialLogin'), category: 'auth' },
  { id: 'api', name: t('features.api'), category: 'tech' },
  { id: 'admin-panel', name: t('features.adminPanel'), category: 'management' },
];

const getIndustries = (t: TranslationFunction) => [
  t('industries.retail'),
  t('industries.fintech'),
  t('industries.health'),
  t('industries.education'),
  t('industries.manufacturing'),
  t('industries.services'),
  t('industries.government'),
  t('industries.ngo'),
  t('industries.other'),
];

export function ProjectEstimator() {
  const t = useTranslations('estimator');
  const { formatCurrency } = useCurrencyFormatter();

  const projectTypes = getProjectTypes(t);
  const features = getFeatures(t);
  const industries = getIndustries(t);

  const [step, setStep] = useState(1);
  const [requirements, setRequirements] = useState<ProjectRequirements>({
    projectType: '',
    complexity: 'medium',
    features: [],
    timeline: 'normal',
    teamSize: 'medium',
    industry: '',
  });
  const [estimate, setEstimate] = useState<ProjectEstimate | null>(null);

  const calculateEstimate = () => {
    // Base costs and durations by project type
    const baseCosts = {
      'web-app': { min: 50000, max: 150000 },
      'mobile-app': { min: 80000, max: 200000 },
      ecommerce: { min: 100000, max: 300000 },
      automation: { min: 30000, max: 100000 },
      consulting: { min: 50000, max: 200000 },
      custom: { min: 100000, max: 500000 },
    };

    const baseDurations = {
      'web-app': { min: 2, max: 4 },
      'mobile-app': { min: 3, max: 6 },
      ecommerce: { min: 3, max: 6 },
      automation: { min: 1, max: 3 },
      consulting: { min: 2, max: 6 },
      custom: { min: 3, max: 12 },
    };

    // Complexity multipliers
    const complexityMultipliers = {
      simple: 0.7,
      medium: 1.0,
      complex: 1.5,
    };

    // Timeline multipliers
    const timelineMultipliers = {
      urgent: 1.3,
      normal: 1.0,
      flexible: 0.9,
    };

    // Feature cost additions (per feature)
    const featureCosts = 5000;

    // Calculate base values
    const projectBase =
      baseCosts[requirements.projectType as keyof typeof baseCosts] || baseCosts.custom;
    const durationBase =
      baseDurations[requirements.projectType as keyof typeof baseDurations] || baseDurations.custom;

    // Apply multipliers
    const complexityMultiplier = complexityMultipliers[requirements.complexity];
    const timelineMultiplier = timelineMultipliers[requirements.timeline];
    const featureAddition = requirements.features.length * featureCosts;

    // Calculate final estimates
    const estimatedCost = {
      min: Math.round(
        projectBase.min * complexityMultiplier * timelineMultiplier + featureAddition
      ),
      max: Math.round(
        projectBase.max * complexityMultiplier * timelineMultiplier + featureAddition
      ),
    };

    const estimatedDuration = {
      min: Math.round(durationBase.min * complexityMultiplier),
      max: Math.round(durationBase.max * complexityMultiplier),
    };

    // Recommend team based on project
    const recommendedTeam = [];
    if (requirements.projectType === 'mobile-app') {
      recommendedTeam.push(t('team.iosDeveloper'), t('team.uiDesigner'));
    }
    if (requirements.features.includes('ai-integration')) {
      recommendedTeam.push(t('team.aiEngineer'));
    }
    if (requirements.complexity === 'complex') {
      recommendedTeam.push(t('team.softwareArchitect'), t('team.projectManager'));
    }
    recommendedTeam.push(t('team.fullStackDeveloper'), t('team.qaEngineer'));

    // Suggest additional features
    const suggestedFeatures = [];
    if (!requirements.features.includes('analytics') && requirements.projectType !== 'consulting') {
      suggestedFeatures.push(t('suggestions.analyticsDashboard'));
    }
    if (
      !requirements.features.includes('api') &&
      ['web-app', 'mobile-app'].includes(requirements.projectType)
    ) {
      suggestedFeatures.push(t('suggestions.futureApi'));
    }

    setEstimate({
      estimatedCost,
      estimatedDuration,
      recommendedTeam,
      suggestedFeatures,
    });
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold mb-4">{t('steps.projectType.title')}</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {projectTypes.map(type => (
                <button
                  key={type.id}
                  onClick={() => {
                    setRequirements({ ...requirements, projectType: type.id });
                    setStep(2);
                  }}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    requirements.projectType === type.id
                      ? 'border-sun bg-sun/10'
                      : 'border-gray-200 dark:border-gray-700 hover:border-sun/50'
                  }`}
                >
                  <div className="text-3xl mb-2">{type.icon}</div>
                  <div className="font-medium">{type.name}</div>
                </button>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold mb-4">{t('steps.complexity.title')}</h3>
            <div className="space-y-3">
              {[
                {
                  value: 'simple',
                  label: t('complexity.simple.label'),
                  description: t('complexity.simple.description'),
                },
                {
                  value: 'medium',
                  label: t('complexity.medium.label'),
                  description: t('complexity.medium.description'),
                },
                {
                  value: 'complex',
                  label: t('complexity.complex.label'),
                  description: t('complexity.complex.description'),
                },
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => {
                    setRequirements({
                      ...requirements,
                      complexity: option.value as 'simple' | 'medium' | 'complex',
                    });
                    setStep(3);
                  }}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                    requirements.complexity === option.value
                      ? 'border-sun bg-sun/10'
                      : 'border-gray-200 dark:border-gray-700 hover:border-sun/50'
                  }`}
                >
                  <div className="font-medium">{option.label}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {option.description}
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold mb-4">{t('steps.features.title')}</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {features.map(feature => (
                <label
                  key={feature.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    requirements.features.includes(feature.id)
                      ? 'border-sun bg-sun/10'
                      : 'border-gray-200 dark:border-gray-700 hover:border-sun/50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={requirements.features.includes(feature.id)}
                    onChange={e => {
                      if (e.target.checked) {
                        setRequirements({
                          ...requirements,
                          features: [...requirements.features, feature.id],
                        });
                      } else {
                        setRequirements({
                          ...requirements,
                          features: requirements.features.filter(f => f !== feature.id),
                        });
                      }
                    }}
                    className="sr-only"
                  />
                  <div className="flex-1">{feature.name}</div>
                </label>
              ))}
            </div>
            <Button onClick={() => setStep(4)} variant="primary" className="w-full">
              {t('continue')}
            </Button>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold mb-4">{t('steps.timeline.title')}</h3>
            <div className="space-y-3">
              {[
                {
                  value: 'urgent',
                  label: t('timeline.urgent.label'),
                  description: t('timeline.urgent.description'),
                },
                {
                  value: 'normal',
                  label: t('timeline.normal.label'),
                  description: t('timeline.normal.description'),
                },
                {
                  value: 'flexible',
                  label: t('timeline.flexible.label'),
                  description: t('timeline.flexible.description'),
                },
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => {
                    setRequirements({
                      ...requirements,
                      timeline: option.value as 'urgent' | 'normal' | 'flexible',
                    });
                    setStep(5);
                  }}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                    requirements.timeline === option.value
                      ? 'border-sun bg-sun/10'
                      : 'border-gray-200 dark:border-gray-700 hover:border-sun/50'
                  }`}
                >
                  <div className="font-medium">{option.label}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {option.description}
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold mb-4">{t('steps.industry.title')}</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {industries.map(industry => (
                <button
                  key={industry}
                  onClick={() => {
                    setRequirements({ ...requirements, industry });
                    calculateEstimate();
                    setStep(6);
                  }}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    requirements.industry === industry
                      ? 'border-sun bg-sun/10'
                      : 'border-gray-200 dark:border-gray-700 hover:border-sun/50'
                  }`}
                >
                  {industry}
                </button>
              ))}
            </div>
          </div>
        );

      case 6:
        return estimate ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <h3 className="text-lg font-semibold mb-4">{t('results.title')}</h3>

            {/* Cost Estimate */}
            <div className="bg-gradient-to-r from-sun/10 to-leaf/10 dark:from-sun/20 dark:to-leaf/20 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className="w-6 h-6 text-sun" />
                <h4 className="font-semibold">{t('results.investment')}</h4>
              </div>
              <p className="text-2xl font-heading">
                {formatCurrency(estimate.estimatedCost.min)} -{' '}
                {formatCurrency(estimate.estimatedCost.max)}
              </p>
            </div>

            {/* Duration Estimate */}
            <div className="bg-gradient-to-r from-lavender/10 to-sun/10 dark:from-lavender/20 dark:to-sun/20 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="w-6 h-6 text-lavender" />
                <h4 className="font-semibold">{t('results.duration')}</h4>
              </div>
              <p className="text-2xl font-heading">
                {estimate.estimatedDuration.min} - {estimate.estimatedDuration.max}{' '}
                {t('results.months')}
              </p>
            </div>

            {/* Recommended Team */}
            <div className="bg-gradient-to-r from-leaf/10 to-lavender/10 dark:from-leaf/20 dark:to-lavender/20 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-6 h-6 text-leaf" />
                <h4 className="font-semibold">{t('results.recommendedTeam')}</h4>
              </div>
              <ul className="space-y-1">
                {estimate.recommendedTeam.map((role, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <span className="text-leaf">•</span>
                    {role}
                  </li>
                ))}
              </ul>
            </div>

            {/* Suggested Features */}
            {estimate.suggestedFeatures.length > 0 && (
              <div className="p-4 bg-obsidian/5 dark:bg-obsidian/20 rounded-lg">
                <p className="text-sm font-medium mb-2">{t('results.alsoConsider')}</p>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  {estimate.suggestedFeatures.map((feature, index) => (
                    <li key={index}>• {feature}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* CTA */}
            <div className="flex gap-3">
              <Button
                variant="primary"
                className="flex-1"
                onClick={() => (window.location.href = '/contact')}
              >
                {t('results.requestProposal')}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setStep(1);
                  setRequirements({
                    projectType: '',
                    complexity: 'medium',
                    features: [],
                    timeline: 'normal',
                    teamSize: 'medium',
                    industry: '',
                  });
                  setEstimate(null);
                }}
              >
                {t('results.anotherEstimate')}
              </Button>
            </div>
          </motion.div>
        ) : null;

      default:
        return null;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-xl">
      <div className="flex items-center gap-3 mb-6">
        <Calculator className="w-8 h-8 text-sun" />
        <h2 className="font-heading text-2xl">{t('title')}</h2>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {t('progress.step')} {step} {t('progress.of')} 6
          </span>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {Math.round((step / 6) * 100)}% {t('progress.completed')}
          </span>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-sun to-leaf"
            initial={{ width: 0 }}
            animate={{ width: `${(step / 6) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Step Content */}
      {renderStep()}

      {/* Navigation */}
      {step > 1 && step < 6 && (
        <button
          onClick={() => setStep(step - 1)}
          className="mt-6 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          {t('back')}
        </button>
      )}
    </div>
  );
}
