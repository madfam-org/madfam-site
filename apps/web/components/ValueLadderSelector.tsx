'use client';

// "Encuentra tu escalón" — the public self-selector.
// Mirrors the AssessmentClient pattern (question ids + mapped options → a scored
// recommendation → CTAs). Two questions map a visitor to a band + a size, then
// the pure `recommendRung` engine (lib/data/value-ladder) returns the smallest
// rung that does the job, its price STATE, and the two CTAs. Honesty rule: the
// rung above is offered as an option, never a default.
//
// The price shown here is whatever the registry states (ruling R9). Today the
// registry ratifies no price for any tier, so this renders the pending sentence.
// It never renders a number this component made up, and never «TBD».

import { useState } from 'react';
import { Button, Card, CardContent } from '@/components/ui';
import {
  recommendRung,
  dhanamCheckoutUrl,
  KALYA_DISCOVERY_CALL_URL,
  NEED_OPTIONS,
  SIZE_OPTIONS,
  type NeedId,
  type SizeId,
  type BandId,
  type TierPricing,
} from '@/lib/data/value-ladder';

export interface ValueLadderSelectorStrings {
  eyebrow: string;
  title: string;
  subtitle: string;
  step: string; // "Paso {current} de {total}" — {current}/{total} substituted client-side
  needQuestion: string;
  sizeQuestion: string;
  needs: Record<NeedId, string>;
  sizes: Record<SizeId, string>;
  bands: Record<BandId, string>;
  bandTaglines: Record<BandId, string>;
  /** Wording for a tier the registry has not priced. */
  pricePending: string;
  resultHeading: string;
  resultRecommended: string; // "Te recomendamos"
  grantsLabel: string;
  bands_grants: Record<BandId, string>;
  upsellLabel: string; // "¿Necesitas más? Sube un escalón:"
  ctaSelfServe: string;
  ctaDiscoveryCall: string;
  ctaExplore: string; // secondary link to the full ladder
  restart: string;
  back: string;
}

interface ValueLadderSelectorProps {
  strings: ValueLadderSelectorStrings;
  /** Anchor id of the full ladder section, for the "explore" secondary CTA. */
  ladderAnchor: string;
}

type Stage = 'need' | 'size' | 'result';

export function ValueLadderSelector({ strings, ladderAnchor }: ValueLadderSelectorProps) {
  const [stage, setStage] = useState<Stage>('need');
  const [need, setNeed] = useState<NeedId | null>(null);
  const [size, setSize] = useState<SizeId | null>(null);

  const formatStep = (current: number) =>
    strings.step.replace('{current}', String(current)).replace('{total}', '2');

  const reset = () => {
    setStage('need');
    setNeed(null);
    setSize(null);
  };

  // ── Stage: need ────────────────────────────────────────────────────────────
  if (stage === 'need') {
    return (
      <div className="max-w-2xl mx-auto">
        <SelectorProgress label={formatStep(1)} percent={0} />
        <fieldset>
          <legend className="text-xl font-semibold text-neutral-900 dark:text-white mb-6">
            {strings.needQuestion}
          </legend>
          <div className="grid sm:grid-cols-2 gap-3">
            {NEED_OPTIONS.map(opt => (
              <Button
                key={opt.id}
                variant="outline"
                className="w-full justify-start text-left py-4 h-auto"
                onClick={() => {
                  setNeed(opt.id);
                  setStage('size');
                }}
              >
                {strings.needs[opt.id]}
              </Button>
            ))}
          </div>
        </fieldset>
      </div>
    );
  }

  // ── Stage: size ────────────────────────────────────────────────────────────
  if (stage === 'size' && need) {
    return (
      <div className="max-w-2xl mx-auto">
        <SelectorProgress label={formatStep(2)} percent={50} />
        <fieldset>
          <legend className="text-xl font-semibold text-neutral-900 dark:text-white mb-6">
            {strings.sizeQuestion}
          </legend>
          <div className="grid sm:grid-cols-3 gap-3">
            {SIZE_OPTIONS.map(sz => (
              <Button
                key={sz}
                variant="outline"
                className="w-full justify-center text-center py-4 h-auto"
                onClick={() => {
                  setSize(sz);
                  setStage('result');
                }}
              >
                {strings.sizes[sz]}
              </Button>
            ))}
          </div>
        </fieldset>
        <div className="mt-6">
          <Button variant="ghost" onClick={() => setStage('need')}>
            ← {strings.back}
          </Button>
        </div>
      </div>
    );
  }

  // ── Stage: result ──────────────────────────────────────────────────────────
  if (stage === 'result' && need && size) {
    const rec = recommendRung(need, size);
    const selfServeHref = rec.checkoutSlug ? dhanamCheckoutUrl(rec.checkoutSlug) : undefined;
    const showSelfServe = rec.motion === 'self-serve' && Boolean(selfServeHref);

    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="p-8">
            <p className="text-sm font-medium text-leaf mb-1">{strings.resultRecommended}</p>
            <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-1">
              {strings.bands[rec.band]}
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">
              {strings.bandTaglines[rec.band]}
            </p>

            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-3xl font-bold text-neutral-900 dark:text-white">
                {renderPricing(rec.pricing, strings.pricePending)}
              </span>
            </div>

            <div className="bg-neutral-50 dark:bg-gray-800/50 rounded-lg p-4 mb-6">
              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                {strings.grantsLabel}
              </p>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {strings.bands_grants[rec.band]}
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3">
              {showSelfServe && selfServeHref && (
                <a
                  href={selfServeHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 px-5 py-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg text-center text-sm font-medium hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lavender"
                >
                  {strings.ctaSelfServe}
                </a>
              )}
              <a
                href={KALYA_DISCOVERY_CALL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex-1 px-5 py-3 rounded-lg text-center text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lavender ${
                  showSelfServe
                    ? 'border border-neutral-300 dark:border-gray-700 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-gray-800'
                    : 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100'
                }`}
              >
                {strings.ctaDiscoveryCall}
              </a>
            </div>

            {/* Upsell — an option, never a default (honesty rule §3.4) */}
            {rec.upsellBand && (
              <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-gray-800">
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-2">
                  {strings.upsellLabel}
                </p>
                <a
                  href={`#${ladderAnchor}`}
                  className="text-sm font-semibold text-lavender hover:text-lavender/80 transition-colors"
                >
                  {strings.bands[rec.upsellBand]} — {strings.bandTaglines[rec.upsellBand]}
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 flex flex-wrap gap-4 justify-center">
          <Button variant="ghost" onClick={reset}>
            ↺ {strings.restart}
          </Button>
          <a
            href={`#${ladderAnchor}`}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            {strings.ctaExplore} →
          </a>
        </div>
      </div>
    );
  }

  return null;
}

/**
 * A price the registry states, or the pending sentence. There is no third
 * branch: this component has no number of its own to fall back to.
 */
function renderPricing(pricing: TierPricing, pending: string): string {
  if (pricing.state === 'pending') return pending;
  return `${new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: pricing.currency,
    maximumFractionDigits: 0,
  }).format(pricing.amount)}`;
}

function SelectorProgress({ label, percent }: { label: string; percent: number }) {
  return (
    <div className="mb-6">
      <div className="flex justify-between text-sm text-neutral-500 dark:text-neutral-400 mb-2">
        <span>{label}</span>
      </div>
      <div
        className="w-full bg-neutral-200 dark:bg-gray-800 rounded-full h-2"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="bg-gradient-to-r from-leaf to-lavender h-2 rounded-full transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
