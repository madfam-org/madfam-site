'use client';

import { useFeatureTracking, useConversionTracking } from '@madfam/analytics';
import { motion } from 'framer-motion';
import { Calculator, TrendingUp, DollarSign, Clock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Button } from '@/components/ui';
import { useCurrencyFormatter, useNumberFormatter } from '@/lib/formatting';

export function ROICalculator() {
  const t = useTranslations('calculator');
  const { formatCurrency } = useCurrencyFormatter();
  const { formatNumber } = useNumberFormatter();

  // Analytics hooks
  const { trackCalculatorUsed } = useFeatureTracking();
  const { trackPurchaseIntent } = useConversionTracking();
  const [formData, setFormData] = useState({
    currentCosts: 50000,
    employeeHours: 160,
    projectsPerMonth: 5,
    averageProjectValue: 20000,
  });

  const [results, setResults] = useState<{
    monthlySavings: number;
    timeSaved: number;
    roiPercentage: number;
    paybackPeriod: number;
  } | null>(null);

  // Base service pricing (MXN)
  const baseServicePrice = 50000;

  const calculateROI = () => {
    const { currentCosts, employeeHours, projectsPerMonth, averageProjectValue } = formData;

    // Track calculator usage
    trackCalculatorUsed({
      type: 'roi',
      result: undefined, // Will be set after calculation
    });

    // Base calculations for AI transformation programs
    const efficiencyGain = 0.35; // 35% efficiency gain
    const costReduction = 0.25; // 25% cost reduction

    const monthlySavings = currentCosts * costReduction;
    const timeSaved = employeeHours * efficiencyGain;
    const additionalRevenue = projectsPerMonth * efficiencyGain * averageProjectValue;
    const totalBenefit = monthlySavings + additionalRevenue / 12;
    const investment = baseServicePrice;
    const roiPercentage = ((totalBenefit * 12 - investment) / investment) * 100;
    const paybackPeriod = investment / totalBenefit;

    const calculatedResults = {
      monthlySavings: Math.round(monthlySavings),
      timeSaved: Math.round(timeSaved),
      roiPercentage: Math.round(roiPercentage),
      paybackPeriod: Math.round(paybackPeriod * 10) / 10,
    };

    setResults(calculatedResults);

    // Track calculator usage with result
    trackCalculatorUsed({
      type: 'roi',
      result: calculatedResults.roiPercentage,
    });

    // Track purchase intent if ROI is positive
    if (calculatedResults.roiPercentage > 0) {
      trackPurchaseIntent('transformation_program', investment);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-xl">
      <div className="flex items-center gap-3 mb-6">
        <Calculator className="w-8 h-8 text-sun" />
        <h3 className="font-heading text-2xl">{t('title')}</h3>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">{t('inputs.currentCosts')}</label>
            <input
              type="range"
              min="10000"
              max="500000"
              step="5000"
              value={formData.currentCosts}
              onChange={e => setFormData({ ...formData, currentCosts: Number(e.target.value) })}
              className="w-full"
            />
            <div className="text-right mt-1 font-mono text-sun">
              {formatCurrency(formData.currentCosts)}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{t('inputs.employeeHours')}</label>
            <input
              type="range"
              min="40"
              max="500"
              step="10"
              value={formData.employeeHours}
              onChange={e => setFormData({ ...formData, employeeHours: Number(e.target.value) })}
              className="w-full"
            />
            <div className="text-right mt-1 font-mono text-sun">
              {formatNumber(formData.employeeHours)} {t('units.hours')}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{t('inputs.projectsPerMonth')}</label>
            <input
              type="range"
              min="1"
              max="20"
              value={formData.projectsPerMonth}
              onChange={e => setFormData({ ...formData, projectsPerMonth: Number(e.target.value) })}
              className="w-full"
            />
            <div className="text-right mt-1 font-mono text-sun">
              {formatNumber(formData.projectsPerMonth)} {t('units.projects')}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{t('inputs.avgProjectValue')}</label>
            <input
              type="range"
              min="5000"
              max="200000"
              step="5000"
              value={formData.averageProjectValue}
              onChange={e =>
                setFormData({ ...formData, averageProjectValue: Number(e.target.value) })
              }
              className="w-full"
            />
            <div className="text-right mt-1 font-mono text-sun">
              {formatCurrency(formData.averageProjectValue)}
            </div>
          </div>

          <Button onClick={calculateROI} variant="creative" className="w-full">
            {t('calculate')}
          </Button>
        </div>

        <div className="space-y-4">
          {results ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="bg-gradient-to-r from-sun/10 to-leaf/10 dark:from-sun/20 dark:to-leaf/20 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <DollarSign className="w-6 h-6 text-sun" />
                  <h4 className="font-semibold">{t('results.savings')}</h4>
                </div>
                <p className="text-3xl font-heading text-sun">
                  {formatCurrency(results.monthlySavings)}
                </p>
              </div>

              <div className="bg-gradient-to-r from-lavender/10 to-sun/10 dark:from-lavender/20 dark:to-sun/20 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="w-6 h-6 text-lavender" />
                  <h4 className="font-semibold">{t('results.timeRecovered')}</h4>
                </div>
                <p className="text-3xl font-heading text-lavender">
                  {formatNumber(results.timeSaved)} {t('units.hoursPerMonth')}
                </p>
              </div>

              <div className="bg-gradient-to-r from-leaf/10 to-lavender/10 dark:from-leaf/20 dark:to-lavender/20 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="w-6 h-6 text-leaf" />
                  <h4 className="font-semibold">{t('results.roi')}</h4>
                </div>
                <p className="text-3xl font-heading text-leaf">{results.roiPercentage}%</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {t('results.payback')}: {formatNumber(results.paybackPeriod)} {t('units.months')}
                </p>
              </div>

              <div className="mt-6 p-4 bg-obsidian/5 dark:bg-obsidian/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">* {t('disclaimer')}</p>
              </div>
            </motion.div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Calculator className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">{t('instructions')}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
