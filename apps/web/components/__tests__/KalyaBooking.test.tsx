import { analytics } from '@madfam-site/analytics';
import { BookingLauncher } from '../booking/BookingLauncher';
import { KalyaBooking, READY_TIMEOUT_MS } from '../booking/KalyaBooking';
import { act, fireEvent, render, screen } from '@/test-utils/providers';
import { KALYA_EMBED_PROTOCOL, KALYA_ORIGIN, cardAttribution } from '@/lib/kalya-embed';

const attribution = cardAttribution('aldo');

function frame(): HTMLIFrameElement {
  const el = document.querySelector('iframe');
  if (!el) throw new Error('no iframe');
  return el;
}

function post(
  data: Record<string, unknown>,
  init: { origin?: string; source?: Window | null } = {}
) {
  act(() => {
    window.dispatchEvent(
      new MessageEvent('message', {
        data: { protocol: KALYA_EMBED_PROTOCOL, handle: 'madfam', ...data },
        origin: init.origin ?? KALYA_ORIGIN,
        source: init.source === undefined ? frame().contentWindow : init.source,
      })
    );
  });
}

describe('KalyaBooking', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.mocked(analytics.track).mockClear();
  });

  it('mounts the embed with this page as origin and ref, and the recommended attributes', () => {
    render(<KalyaBooking attribution={attribution} />);
    const src = new URL(frame().src);
    expect(src.origin).toBe(KALYA_ORIGIN);
    expect(src.pathname).toBe('/embed/madfam/discovery-call');
    expect(src.searchParams.get('origin')).toBe(window.location.origin);
    expect(src.searchParams.get('ref')).toBe(window.location.pathname);
    expect(src.searchParams.get('utm_content')).toBe('aldo');
    expect(frame()).toHaveAttribute('title', 'Agenda de MADFAM en Kalya');
    expect(frame().getAttribute('sandbox')).toBe(
      'allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads'
    );
    expect(frame()).toHaveAttribute('allow', 'clipboard-write');
    expect(frame()).toHaveAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
    expect(frame().style.height).toBe('560px');
  });

  it('shows the loading state with the plain link until the frame is ready', () => {
    render(<KalyaBooking attribution={attribution} />);
    expect(screen.getByText('Cargando la agenda…')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /¿No carga\?/ })).toHaveAttribute(
      'href',
      `${KALYA_ORIGIN}/madfam?utm_source=madf.am&utm_medium=qr&utm_campaign=tarjeta&utm_content=aldo`
    );

    post({ type: 'ready', eventType: 'discovery-call' });
    expect(screen.queryByText('Cargando la agenda…')).not.toBeInTheDocument();

    post({ type: 'resize', height: 812 });
    expect(frame().style.height).toBe('812px');
  });

  it('ignores messages from another origin or window', () => {
    render(<KalyaBooking attribution={attribution} />);
    post({ type: 'ready', eventType: null }, { origin: 'https://evil.example' });
    post({ type: 'ready', eventType: null }, { source: window });
    expect(screen.getByText('Cargando la agenda…')).toBeInTheDocument();
  });

  it('offers Kalya itself when the frame never says ready', () => {
    vi.useFakeTimers();
    render(<KalyaBooking attribution={attribution} />);
    act(() => {
      vi.advanceTimersByTime(READY_TIMEOUT_MS);
    });
    expect(screen.getByText('No pudimos mostrar la agenda aquí.')).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /Abrir la agenda en Kalya/ });
    expect(link).toHaveAttribute('target', '_blank');
    expect(frame()).toHaveClass('hidden');
  });

  it('confirms a booking on the host side and records it once', () => {
    render(<KalyaBooking attribution={attribution} />);
    post({ type: 'ready', eventType: 'discovery-call' });
    const booked = {
      type: 'booked',
      eventType: 'discovery-call',
      start: '2026-11-04T16:00:00Z',
      end: '2026-11-04T16:30:00Z',
    };
    post(booked);
    post(booked);
    expect(screen.getByRole('status')).toHaveTextContent('Listo, tu llamada quedó agendada.');
    expect(analytics.track).toHaveBeenCalledTimes(1);
    expect(analytics.track).toHaveBeenCalledWith('booking_completed', {
      eventType: 'discovery-call',
      source: 'aldo',
    });
  });
});

describe('BookingLauncher', () => {
  const original = HTMLDialogElement.prototype.showModal;
  afterEach(() => {
    HTMLDialogElement.prototype.showModal = original;
  });

  it('is a real link to Kalya, so no-JS visitors still book', () => {
    render(
      <BookingLauncher attribution={attribution} target="_blank">
        Agendar
      </BookingLauncher>
    );
    const link = screen.getByRole('link', { name: 'Agendar' });
    expect(link).toHaveAttribute(
      'href',
      `${KALYA_ORIGIN}/madfam?utm_source=madf.am&utm_medium=qr&utm_campaign=tarjeta&utm_content=aldo`
    );
    expect(link).toHaveAttribute('rel', 'noopener');
    expect(link).toHaveAttribute('target', '_blank');
    expect(document.querySelector('iframe')).toBeNull();
  });

  it('opens the booking in-page on a plain click', () => {
    const showModal = vi.fn();
    HTMLDialogElement.prototype.showModal = showModal;
    render(<BookingLauncher attribution={attribution}>Agendar</BookingLauncher>);
    const link = screen.getByRole('link', { name: 'Agendar' });

    const prevented = !fireEvent.click(link);
    expect(prevented).toBe(true);
    expect(showModal).toHaveBeenCalledTimes(1);
    expect(document.querySelector('dialog iframe')).not.toBeNull();
  });

  it("opens a teammate's own event type when the card names one", () => {
    HTMLDialogElement.prototype.showModal = vi.fn();
    render(
      <BookingLauncher
        attribution={cardAttribution('carolina')}
        eventType="llamada-carolina"
        dialogTitle="Agenda una llamada con Carolina"
        dialogSubtitle="30 minutos por videollamada."
      >
        Agendar
      </BookingLauncher>
    );
    fireEvent.click(screen.getByRole('link', { name: 'Agendar' }));
    const src = new URL(frame().src);
    expect(src.pathname).toBe('/embed/madfam/llamada-carolina');
    expect(src.searchParams.get('utm_content')).toBe('carolina');
    expect(
      screen.getByRole('heading', { name: 'Agenda una llamada con Carolina', hidden: true })
    ).toBeInTheDocument();
    expect(screen.queryByText(/equipo de MADFAM/)).not.toBeInTheDocument();
  });

  it('leaves modified clicks to the browser', () => {
    const showModal = vi.fn();
    HTMLDialogElement.prototype.showModal = showModal;
    render(<BookingLauncher attribution={attribution}>Agendar</BookingLauncher>);
    const link = screen.getByRole('link', { name: 'Agendar' });
    // jsdom cannot navigate; cancel after React has seen the click (bubble, window).
    const cancel = (event: Event) => event.preventDefault();
    window.addEventListener('click', cancel);
    try {
      fireEvent.click(link, { metaKey: true });
      fireEvent.click(link, { button: 1 });
      expect(showModal).not.toHaveBeenCalled();
    } finally {
      window.removeEventListener('click', cancel);
    }
  });
});
