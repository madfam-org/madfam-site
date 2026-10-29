'use client';

import { useEffect, useRef } from 'react';
import { GATE_ATTRIBUTE } from './gate';

/** Source of the paper engine this card runs (AGPL-3.0-only, §13). */
export const PLIEGO_SOURCE = 'https://github.com/madfam-org/pliego';

/** The card's rest rectangle inside the stage: 78 % wide (renderer CARD_FRACTION), 9:5, centred. */
const cardRect = 'absolute left-[11%] top-1/2 w-[78%] -translate-y-1/2 aspect-[9/5]';

export interface PaperCardHeroProps {
  name: string;
  title?: string;
  org: string;
  shortLink: string;
  qrSrc: string;
  logoSrc: string;
  labels: { flip: string; hint: string; engine: string };
}

/**
 * A 3D paper business card above the contact card: SBS board simulated by
 * Pliego's paper engine, lit by a light that follows the pointer or the
 * phone's tilt, the name in hot foil, the marca QR on the back. Progressive
 * enhancement only: until it is live a static front stands in, and if
 * anything fails the hero removes itself and the page is as it was.
 */
export function PaperCardHero(props: PaperCardHeroProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hitRef = useRef<HTMLDivElement>(null);
  const { name, title, org, shortLink, qrSrc, logoSrc } = props;

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    const hit = hitRef.current;
    if (!root || !canvas || !hit || !document.documentElement.hasAttribute(GATE_ATTRIBUTE)) return;

    let dispose: (() => void) | undefined;
    let cancelled = false;
    const fail = (error?: unknown) => {
      dispose?.();
      dispose = undefined;
      root.dataset.state = 'failed';
      document.documentElement.removeAttribute(GATE_ATTRIBUTE);
      if (error) console.warn('paper card unavailable:', error);
    };
    const onFailed = () => fail();
    root.addEventListener('paper-card-failed', onFailed);

    const start = () => {
      if (cancelled) return;
      import(/* webpackChunkName: "paper-card" */ './renderer')
        .then(({ startPaperCard }) =>
          startPaperCard({
            root,
            canvas,
            hit,
            art: { name, title, org, shortLink, qrSrc, logoSrc },
            onLive: () => {
              root.dataset.state = 'live';
            },
            onFlip: back => hit.setAttribute('aria-pressed', String(back)),
          })
        )
        .then(d => {
          if (cancelled) d();
          else dispose = d;
        })
        .catch(fail);
    };
    // After first paint and the browser's own startup work.
    const idle = window.requestIdleCallback
      ? window.requestIdleCallback(start, { timeout: 1500 })
      : window.setTimeout(start, 300);

    return () => {
      cancelled = true;
      if (window.cancelIdleCallback) window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
      root.removeEventListener('paper-card-failed', onFailed);
      dispose?.();
    };
  }, [name, title, org, shortLink, qrSrc, logoSrc]);

  return (
    <div
      ref={rootRef}
      data-paper-card=""
      data-state="poster"
      className="group/paper relative mb-6 hidden [[data-card3d]_&]:block"
    >
      <div className="relative aspect-[16/10] w-full select-none">
        {/* Static front while the engine loads (and the first thing painted). */}
        <div
          aria-hidden="true"
          className={`${cardRect} @container overflow-hidden rounded-lg bg-obsidian shadow-[0_28px_48px_-24px_rgba(0,0,0,0.9),0_8px_16px_-12px_rgba(0,0,0,0.8)] ring-1 ring-white/10 transition-opacity duration-300 group-data-[state=live]/paper:opacity-0`}
        >
          <div className="absolute top-[13%] left-[7.8%] text-[2.9cqw] font-semibold tracking-wide text-pearl">
            MADFAM
          </div>
          <div className="absolute right-[7.8%] bottom-[30%] left-[7.8%] bg-linear-to-r/oklch from-leaf via-lavender to-sun bg-clip-text text-[8.4cqw] leading-[1.08] font-bold tracking-[-0.02em] text-transparent">
            {name}
          </div>
          <div className="absolute bottom-[10%] left-[7.8%] text-[3.4cqw] text-pearl/90">
            {title ?? org}
          </div>
        </div>

        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full opacity-0 transition-opacity duration-300 group-data-[state=live]/paper:opacity-100"
        />

        <div
          ref={hitRef}
          role="button"
          tabIndex={0}
          aria-label={props.labels.flip}
          aria-pressed="false"
          className={`${cardRect} cursor-grab touch-none rounded-lg outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sun active:cursor-grabbing`}
        />
      </div>

      <p className="text-center text-sm text-pearl/70">
        {props.labels.hint}
        <span aria-hidden="true"> · </span>
        <a
          href={PLIEGO_SOURCE}
          rel="noopener"
          className="inline-block py-2 text-pearl/70 underline decoration-lavender/60 underline-offset-4 hover:text-pearl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sun"
        >
          {props.labels.engine}
        </a>
      </p>
    </div>
  );
}
