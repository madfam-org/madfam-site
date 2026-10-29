'use client';

import { useEffect, useReducer, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowUpRight, CalendarCheck } from 'lucide-react';
import { analytics } from '@madfam-site/analytics';
import { cn } from '@/components/ui/utils';
import {
  INITIAL_EMBED_STATE,
  kalyaBookingUrl,
  kalyaEmbedReducer,
  kalyaEmbedUrl,
  parseKalyaMessage,
  type BookingAttribution,
} from '@/lib/kalya-embed';

/** How long the frame has to say `ready` before the host offers Kalya itself. */
export const READY_TIMEOUT_MS = 8000;
/** Frame height before its first `resize`. */
const MIN_FRAME_HEIGHT = 560;

const SANDBOX =
  'allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads';

const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sun';

export interface KalyaBookingProps {
  attribution: BookingAttribution;
  className?: string;
}

function formatWhen(iso: string, locale: string): string | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(locale, { dateStyle: 'full', timeStyle: 'short' }).format(date);
}

/**
 * MADFAM's Kalya booking flow inside madfam.io: an auto-resizing iframe of
 * Kalya's embed surface driven by the `kalya-embed/v1` messages
 * (`lib/kalya-embed.ts`). No Kalya script runs on this page. Until the frame
 * says `ready` the visitor sees a loading state with the plain Kalya link; if
 * it never does (CSP refusal, network, timeout) the link becomes the action.
 */
export function KalyaBooking({ attribution, className }: KalyaBookingProps) {
  const t = useTranslations('common.booking');
  const locale = useLocale();
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [state, dispatch] = useReducer(kalyaEmbedReducer, INITIAL_EMBED_STATE);
  const trackedBooking = useRef<string | null>(null);

  const { utm_source, utm_medium, utm_campaign, utm_content, utm_term } = attribution;
  const plainUrl = kalyaBookingUrl(attribution);

  // The embed URL names this page's origin and path, so it is built on the client.
  useEffect(() => {
    setSrc(
      kalyaEmbedUrl({
        hostOrigin: window.location.origin,
        ref: window.location.pathname,
        attribution: { utm_source, utm_medium, utm_campaign, utm_content, utm_term },
      })
    );
  }, [utm_source, utm_medium, utm_campaign, utm_content, utm_term]);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      const message = parseKalyaMessage(event, frameRef.current?.contentWindow);
      if (!message) return;
      dispatch(message);
      if (message.type === 'booked' && trackedBooking.current !== message.start) {
        trackedBooking.current = message.start;
        analytics.track('booking_completed', {
          eventType: message.eventType,
          source: utm_content ?? utm_campaign,
        });
      }
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [utm_campaign, utm_content]);

  useEffect(() => {
    if (!src) return;
    const timer = window.setTimeout(() => dispatch({ type: 'timeout' }), READY_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [src]);

  const when = state.booked ? formatWhen(state.booked.start, locale) : null;

  return (
    <div className={cn('relative', className)}>
      {state.booked && (
        <div
          role="status"
          className="mb-4 flex items-start gap-3 rounded-xl border border-leaf/40 bg-leaf/10 px-4 py-3 text-pearl"
        >
          <CalendarCheck aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-leaf" />
          <p className="text-base leading-snug">
            <span className="block font-semibold">{t('bookedTitle')}</span>
            {when && <span className="block text-pearl/80">{t('bookedWhen', { when })}</span>}
            <span className="block text-sm text-pearl/70">{t('bookedDetails')}</span>
          </p>
        </div>
      )}

      {state.status === 'failed' ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-white/15 bg-white/5 px-6 py-10 text-center">
          <p className="text-base text-pearl/80">{t('failed')}</p>
          <a
            href={plainUrl}
            target="_blank"
            rel="noopener"
            className={`inline-flex min-h-12 items-center gap-2 rounded-xl bg-gradient-to-r from-leaf to-sun px-6 py-3 text-base font-bold text-obsidian transition-[filter] duration-200 hover:brightness-110 ${focusRing}`}
          >
            {t('openInKalya')}
            <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
            <span className="sr-only">{t('newTab')}</span>
          </a>
        </div>
      ) : (
        state.status === 'loading' && (
          <div
            aria-live="polite"
            className="absolute inset-x-0 top-0 z-10 flex min-h-[560px] flex-col items-center justify-center gap-4 text-center"
          >
            <span
              aria-hidden="true"
              className="h-10 w-10 rounded-full border-2 border-white/15 border-t-leaf motion-safe:animate-spin"
            />
            <p className="text-base text-pearl/80">{t('loading')}</p>
            <a
              href={plainUrl}
              target="_blank"
              rel="noopener"
              className={`text-sm font-medium text-pearl/70 underline decoration-lavender/60 underline-offset-4 hover:text-pearl ${focusRing}`}
            >
              {t('notLoading')}
              <span className="sr-only"> {t('newTab')}</span>
            </a>
          </div>
        )
      )}

      {src && (
        <iframe
          ref={frameRef}
          src={src}
          title={t('frameTitle')}
          sandbox={SANDBOX}
          allow="clipboard-write"
          referrerPolicy="strict-origin-when-cross-origin"
          onError={() => dispatch({ type: 'error' })}
          className={cn(
            'block w-full border-0 bg-transparent scheme-dark transition-opacity duration-300',
            state.status === 'ready' ? 'opacity-100' : 'pointer-events-none opacity-0',
            state.status === 'failed' && 'hidden'
          )}
          // The one inline style: the height the frame reports, not a design value.
          style={{ height: `${state.height ?? MIN_FRAME_HEIGHT}px` }}
        />
      )}
      {!src && <div aria-hidden="true" className="min-h-[560px]" />}
    </div>
  );
}
