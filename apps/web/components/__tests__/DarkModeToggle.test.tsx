import { fireEvent, waitFor } from '@testing-library/react';
import { DarkModeToggle } from '../DarkModeToggle';
import { render, screen } from '@/test-utils/providers';

function mockSystemDark(dark: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: dark && query.includes('dark'),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

describe('DarkModeToggle', () => {
  const root = document.documentElement;

  beforeEach(() => {
    localStorage.clear();
    root.classList.remove('dark', 'light');
  });

  it('follows a dark OS setting without saving a preference', async () => {
    mockSystemDark(true);
    render(<DarkModeToggle />, { locale: 'es' });

    await waitFor(() => expect(root.classList.contains('dark')).toBe(true));
    expect(localStorage.getItem('theme')).toBeNull();
  });

  // The `dark` variant also matches prefers-color-scheme: dark unless an
  // ancestor has `.light`, so an explicit light choice must set that class.
  it('applies an explicit light choice over a dark OS setting', async () => {
    mockSystemDark(true);
    localStorage.setItem('theme', 'light');
    render(<DarkModeToggle />, { locale: 'es' });

    await waitFor(() => expect(root.classList.contains('light')).toBe(true));
    expect(root.classList.contains('dark')).toBe(false);
  });

  it('saves the preference only when the visitor toggles', async () => {
    mockSystemDark(true);
    render(<DarkModeToggle />, { locale: 'es' });
    await waitFor(() => expect(root.classList.contains('dark')).toBe(true));

    fireEvent.click(await screen.findByRole('button'));

    await waitFor(() => expect(root.classList.contains('light')).toBe(true));
    expect(root.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem('theme')).toBe('light');
  });
});
