'use client';

import { useEffect, useId, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { KalyaBooking } from './KalyaBooking';
import { OWN_SITE_REL } from '@/lib/ecosystem-links';
import { kalyaBookingUrl, type BookingAttribution } from '@/lib/kalya-embed';

export interface BookingLauncherProps {
  attribution: BookingAttribution;
  children: ReactNode;
  className?: string;
  /** Where the plain link opens when the in-page booking is not used. */
  target?: '_blank';
  'aria-label'?: string;
}

const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sun';

/** A plain click: no modifier, primary button. Anything else keeps the browser's own behaviour. */
function isPlainClick(event: MouseEvent): boolean {
  return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
}

/**
 * A booking CTA that is a real link to Kalya's booking page (tagged with
 * `attribution`), progressively enhanced: once hydrated, a plain click opens
 * MADFAM's Kalya flow in an in-page dialog instead — a full-screen sheet on a
 * phone, a centred panel from `sm` up. No JS, no `<dialog>` support, or a
 * modified click (new tab, new window) all reach Kalya through the href.
 */
export function BookingLauncher({
  attribution,
  children,
  className,
  target,
  'aria-label': ariaLabel,
}: BookingLauncherProps) {
  const t = useTranslations('common.booking');
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [hydrated, setHydrated] = useState(false);
  // The frame loads on first open only, then stays mounted so a reopen keeps its step.
  const [embedMounted, setEmbedMounted] = useState(false);
  const href = kalyaBookingUrl(attribution);

  useEffect(() => {
    setHydrated(true);
    return () => document.documentElement.classList.remove('overflow-hidden');
  }, []);

  function open(event: MouseEvent<HTMLAnchorElement>) {
    const dialog = dialogRef.current;
    if (event.defaultPrevented || !isPlainClick(event)) return;
    if (!dialog || typeof dialog.showModal !== 'function') return;
    event.preventDefault();
    setEmbedMounted(true);
    document.documentElement.classList.add('overflow-hidden');
    dialog.showModal();
  }

  function close() {
    dialogRef.current?.close();
  }

  return (
    <>
      <a
        href={href}
        target={target}
        rel={OWN_SITE_REL}
        className={className}
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        onClick={open}
      >
        {children}
      </a>
      {hydrated &&
        createPortal(
          <dialog
            ref={dialogRef}
            aria-labelledby={titleId}
            onClose={() => document.documentElement.classList.remove('overflow-hidden')}
            // A click that lands on the dialog element itself is a click on the backdrop.
            onClick={event => {
              if (event.target === event.currentTarget) close();
            }}
            className="m-0 scheme-dark h-[100dvh] max-h-none w-full max-w-none overflow-hidden border-0 bg-transparent p-0 text-left text-pearl backdrop:bg-obsidian/80 backdrop:backdrop-blur-sm sm:m-auto sm:h-auto sm:max-h-[min(92dvh,60rem)] sm:w-[min(100%_-_2rem,44rem)] sm:rounded-2xl"
          >
            <div className="h-full bg-gradient-to-br from-leaf via-lavender to-sun sm:rounded-2xl sm:p-px">
              <div className="relative isolate flex h-full flex-col overflow-hidden bg-obsidian sm:max-h-[calc(min(92dvh,60rem)_-_2px)] sm:rounded-2xl">
                <div
                  aria-hidden="true"
                  className="absolute -top-24 -left-24 -z-10 h-80 w-80 rounded-full bg-leaf/15 blur-3xl"
                />
                <div
                  aria-hidden="true"
                  className="absolute -right-24 -bottom-24 -z-10 h-80 w-80 rounded-full bg-lavender/20 blur-3xl"
                />

                <header className="flex items-start gap-4 border-b border-white/10 px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-4 sm:px-8 sm:pt-6">
                  <div className="min-w-0 flex-1">
                    {/* OKLCH interpolation: the sRGB leaf→lavender blend passes through gray. */}
                    <h2
                      id={titleId}
                      className="bg-linear-to-r/oklch from-leaf via-lavender to-sun bg-clip-text text-2xl leading-tight font-bold tracking-[-0.02em] text-balance text-transparent sm:text-3xl"
                    >
                      {t('dialogTitle')}
                    </h2>
                    <p className="mt-1 text-base text-pearl/75">{t('dialogSubtitle')}</p>
                  </div>
                  <button
                    type="button"
                    onClick={close}
                    aria-label={t('close')}
                    className={`-mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-pearl/70 transition-colors hover:bg-white/10 hover:text-pearl ${focusRing}`}
                  >
                    <X aria-hidden="true" className="h-5 w-5" />
                  </button>
                </header>

                <div className="flex-1 [scrollbar-color:rgb(250_250_250/0.25)_transparent] [scrollbar-width:thin] overflow-y-auto overscroll-contain px-3 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">
                  {embedMounted && <KalyaBooking attribution={attribution} />}
                </div>
              </div>
            </div>
          </dialog>,
          document.body
        )}
    </>
  );
}
