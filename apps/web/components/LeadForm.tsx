'use client';

/**
 * Lead Capture Form - Web App Specific Implementation
 *
 * This form captures enough commercial and operational context to route MADFAM
 * visitors into the correct ecosystem path without requiring a schema migration.
 * Core fields are stored on the Lead record; qualification fields are persisted
 * in metadata for downstream CRM, n8n, and ops routing.
 */

import { zodResolver } from '@hookform/resolvers/zod';
import { useFormTracking, useConversionTracking, useErrorTracking } from '@madfam/analytics';
import { logger } from '@madfam/core';
import { useTranslations, useLocale } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui';

const INTENTS = [
  'platform',
  'build-with-madfam',
  'ecosystem-membership',
  'partner-invest',
  'support',
] as const;

const TIMELINES = ['now', '30-days', 'quarter', 'exploring'] as const;
const BUDGETS = ['not-sure', 'under-100k-mxn', '100k-500k-mxn', '500k-plus-mxn'] as const;
const FOLLOW_UP = ['email', 'whatsapp', 'call'] as const;

const createLeadFormSchema = (t: (key: string) => string) =>
  z.object({
    name: z.string().min(2, t('errors.nameMin')),
    email: z.string().email(t('errors.emailInvalid')),
    company: z.string().optional(),
    phone: z.string().optional(),
    intent: z.string().min(1, t('errors.intentRequired')),
    timeline: z.string().min(1, t('errors.timelineRequired')),
    budget: z.string().optional(),
    region: z.string().min(2, t('errors.regionRequired')),
    followUp: z.string().min(1, t('errors.followUpRequired')),
    message: z.string().min(10, t('errors.messageMin')),
  });

type LeadFormData = z.infer<ReturnType<typeof createLeadFormSchema>>;

interface LeadFormProps {
  source?: string;
  initialIntent?: string;
  onSuccess?: () => void;
}

function normalizeIntent(intent?: string): string {
  return INTENTS.includes(intent as (typeof INTENTS)[number]) && intent ? intent : 'platform';
}

export function LeadForm({ source = 'website', initialIntent, onSuccess }: LeadFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const t = useTranslations('leadForm');
  const locale = useLocale();
  const normalizedIntent = normalizeIntent(initialIntent);

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
    defaultValues: {
      intent: normalizedIntent,
      timeline: '',
      budget: '',
      region: '',
      followUp: 'email',
    },
  });

  const onSubmit = async (data: LeadFormData) => {
    setIsSubmitting(true);
    setSubmitStatus('idle');

    const metadata = {
      intent: data.intent,
      offerPath: data.intent,
      timeline: data.timeline,
      budget: data.budget || undefined,
      region: data.region,
      followUp: data.followUp,
    };

    // Track form submission start
    trackContactStarted('lead-form');

    // Track engagement - user is showing interest
    trackServiceFunnelStep('contact', data.intent, { source });

    // In staging environment, simulate submission without API call
    if (process.env.NEXT_PUBLIC_ENV === 'staging') {
      logger.info('Staging environment - Lead form submission', 'LEAD_FORM', {
        source,
        locale,
        metadata,
      });

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Track successful form completion (staging)
      trackContactCompleted('lead-form');

      // Track lead captured
      trackLeadCaptured({
        source,
        form: 'lead-form',
      });

      // Track funnel conversion step
      trackServiceFunnelStep('conversion', data.intent, {
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
          name: data.name,
          email: data.email,
          company: data.company,
          phone: data.phone,
          message: data.message,
          metadata,
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
          intent: data.intent,
        });

        // Track successful form completion
        trackContactCompleted('lead-form');

        // Track lead captured
        trackLeadCaptured({
          source,
          form: 'lead-form',
        });

        // Track funnel conversion step
        trackServiceFunnelStep('conversion', data.intent, {
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
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'name-error' : undefined}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavender focus:border-transparent"
            placeholder={t('placeholders.name')}
          />
          {errors.name && (
            <p id="name-error" role="alert" className="mt-1 text-sm text-red-600">
              {errors.name.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            {t('fields.email')} *
          </label>
          <input
            {...register('email')}
            type="email"
            id="email"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavender focus:border-transparent"
            placeholder={t('placeholders.email')}
          />
          {errors.email && (
            <p id="email-error" role="alert" className="mt-1 text-sm text-red-600">
              {errors.email.message}
            </p>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
            {t('fields.company')}
          </label>
          <input
            {...register('company')}
            type="text"
            id="company"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavender focus:border-transparent"
            placeholder={t('placeholders.company')}
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
            {t('fields.phone')}
          </label>
          <input
            {...register('phone')}
            type="tel"
            id="phone"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavender focus:border-transparent"
            placeholder={t('placeholders.phone')}
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="intent" className="block text-sm font-medium text-gray-700 mb-2">
            {t('fields.intent')} *
          </label>
          <select
            {...register('intent')}
            id="intent"
            aria-invalid={!!errors.intent}
            aria-describedby={errors.intent ? 'intent-error' : undefined}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavender focus:border-transparent bg-white"
          >
            {INTENTS.map(intent => (
              <option key={intent} value={intent}>
                {t(`intents.${intent}`)}
              </option>
            ))}
          </select>
          {errors.intent && (
            <p id="intent-error" role="alert" className="mt-1 text-sm text-red-600">
              {errors.intent.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="timeline" className="block text-sm font-medium text-gray-700 mb-2">
            {t('fields.timeline')} *
          </label>
          <select
            {...register('timeline')}
            id="timeline"
            aria-invalid={!!errors.timeline}
            aria-describedby={errors.timeline ? 'timeline-error' : undefined}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavender focus:border-transparent bg-white"
          >
            <option value="">{t('options.select')}</option>
            {TIMELINES.map(timeline => (
              <option key={timeline} value={timeline}>
                {t(`timelines.${timeline}`)}
              </option>
            ))}
          </select>
          {errors.timeline && (
            <p id="timeline-error" role="alert" className="mt-1 text-sm text-red-600">
              {errors.timeline.message}
            </p>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div>
          <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-2">
            {t('fields.budget')}
          </label>
          <select
            {...register('budget')}
            id="budget"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavender focus:border-transparent bg-white"
          >
            <option value="">{t('options.select')}</option>
            {BUDGETS.map(budget => (
              <option key={budget} value={budget}>
                {t(`budgets.${budget}`)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-2">
            {t('fields.region')} *
          </label>
          <input
            {...register('region')}
            type="text"
            id="region"
            aria-invalid={!!errors.region}
            aria-describedby={errors.region ? 'region-error' : undefined}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavender focus:border-transparent"
            placeholder={t('placeholders.region')}
          />
          {errors.region && (
            <p id="region-error" role="alert" className="mt-1 text-sm text-red-600">
              {errors.region.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="followUp" className="block text-sm font-medium text-gray-700 mb-2">
            {t('fields.followUp')} *
          </label>
          <select
            {...register('followUp')}
            id="followUp"
            aria-invalid={!!errors.followUp}
            aria-describedby={errors.followUp ? 'followUp-error' : undefined}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavender focus:border-transparent bg-white"
          >
            {FOLLOW_UP.map(channel => (
              <option key={channel} value={channel}>
                {t(`followUp.${channel}`)}
              </option>
            ))}
          </select>
          {errors.followUp && (
            <p id="followUp-error" role="alert" className="mt-1 text-sm text-red-600">
              {errors.followUp.message}
            </p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
          {t('fields.message')} *
        </label>
        <textarea
          {...register('message')}
          id="message"
          rows={5}
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? 'message-error' : undefined}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavender focus:border-transparent"
          placeholder={t('placeholders.message')}
        />
        {errors.message && (
          <p id="message-error" role="alert" className="mt-1 text-sm text-red-600">
            {errors.message.message}
          </p>
        )}
      </div>

      {submitStatus === 'success' && (
        <div
          role="status"
          aria-live="polite"
          className="p-4 bg-leaf/10 border border-leaf/20 rounded-lg"
        >
          <p className="text-leaf font-medium">{t('messages.success')}</p>
        </div>
      )}

      {submitStatus === 'error' && (
        <div role="alert" className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 font-medium">{t('messages.error')}</p>
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
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
