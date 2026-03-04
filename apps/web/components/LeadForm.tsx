'use client';

/**
 * Simple Lead Capture Form - Web App Specific Implementation
 *
 * This is a SIMPLIFIED, single-step form optimized for the main website.
 * Includes web-app specific analytics integration and staging environment handling.
 *
 * Note: This is NOT a duplicate of @madfam-site/ui LeadForm
 * - @madfam-site/ui LeadForm: Multi-step, feature-rich, reusable component
 * - This component: Simple, single-step, web-app specific with custom analytics
 *
 * Both serve different purposes and are intentionally separate implementations.
 */

import { zodResolver } from '@hookform/resolvers/zod';
import { useFormTracking, useConversionTracking, useErrorTracking } from '@madfam/analytics';
import { logger } from '@madfam/core';
import { useTranslations, useLocale } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui';

const createLeadFormSchema = (t: (key: string) => string) =>
  z.object({
    name: z.string().min(2, t('errors.nameMin')),
    email: z.string().email(t('errors.emailInvalid')),
    message: z.string().min(10, t('errors.messageMin')),
  });

type LeadFormData = z.infer<ReturnType<typeof createLeadFormSchema>>;

interface LeadFormProps {
  source?: string;
  onSuccess?: () => void;
}

export function LeadForm({ source = 'website', onSuccess }: LeadFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const t = useTranslations('leadForm');
  const locale = useLocale();

  // Analytics hooks
  const { trackContactStarted, trackContactCompleted, trackLeadCaptured } = useFormTracking();
  const { trackServiceFunnelStep } = useConversionTracking();
  const { trackError } = useErrorTracking();

  const leadFormSchema = createLeadFormSchema(t);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {},
  });

  const onSubmit = async (data: LeadFormData) => {
    setIsSubmitting(true);
    setSubmitStatus('idle');

    // Track form submission start
    trackContactStarted('lead-form');

    // Track engagement - user is showing interest
    trackServiceFunnelStep('contact', 'general_inquiry', { source });

    // In staging environment, simulate submission without API call
    if (process.env.NEXT_PUBLIC_ENV === 'staging') {
      logger.info('Staging environment - Lead form submission', 'LEAD_FORM', {
        source,
        locale,
      });

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Track successful form completion (staging)
      trackContactCompleted('lead-form'); // Mock lead score

      // Track lead captured
      trackLeadCaptured({
        source,
        form: 'lead-form',
      });

      // Track funnel conversion step
      trackServiceFunnelStep('conversion', 'general_inquiry', {
        source,
        environment: 'staging',
      });

      setSubmitStatus('success');
      reset();
      onSuccess?.();
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          source,
          preferredLanguage: locale,
        }),
      });

      const result = await response.json();

      if (result.success) {
        logger.userAction('Lead form submitted successfully', {
          source,
          leadId: result.leadId,
          locale,
        });

        // Track successful form completion
        trackContactCompleted('lead-form');

        // Track lead captured
        trackLeadCaptured({
          source,
          form: 'lead-form',
        });

        // Track funnel conversion step
        trackServiceFunnelStep('conversion', 'general_inquiry', {
          source,
          leadId: result.leadId,
        });

        setSubmitStatus('success');
        reset();
        onSuccess?.();
      } else {
        // Track error
        trackError('Lead form submission failed', 'form-submission', 'medium');

        logger.warn('Lead form submission failed', 'LEAD_FORM', {
          source,
          error: result.error,
          locale,
        });
        setSubmitStatus('error');
      }
    } catch (error) {
      // Track error
      trackError('Lead form submission error', 'form-submission', 'high');

      logger.error('Lead form submission error', error as Error, 'LEAD_FORM', {
        source,
        locale,
      });
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            {t('fields.name')} *
          </label>
          <input
            {...register('name')}
            type="text"
            id="name"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavender focus:border-transparent"
            placeholder={t('placeholders.name')}
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            {t('fields.email')} *
          </label>
          <input
            {...register('email')}
            type="email"
            id="email"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavender focus:border-transparent"
            placeholder={t('placeholders.email')}
          />
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
          What do you need help with? *
        </label>
        <textarea
          {...register('message')}
          id="message"
          rows={5}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavender focus:border-transparent"
          placeholder="Tell us about your project, challenges, or questions..."
        />
        {errors.message && <p className="mt-1 text-sm text-red-600">{errors.message.message}</p>}
      </div>

      {submitStatus === 'success' && (
        <div className="p-4 bg-leaf/10 border border-leaf/20 rounded-lg">
          <p className="text-leaf font-medium">{t('messages.success')}</p>
        </div>
      )}

      {submitStatus === 'error' && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 font-medium">{t('messages.error')}</p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">* {t('requiredFields')}</p>
        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={isSubmitting}
          disabled={isSubmitting || submitStatus === 'success'}
        >
          {t('submit')}
        </Button>
      </div>
    </form>
  );
}
