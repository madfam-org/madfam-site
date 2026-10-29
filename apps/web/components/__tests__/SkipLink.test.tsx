import { SkipLink } from '../SkipLink';
import { render, screen } from '@/test-utils/providers';

describe('SkipLink', () => {
  it.each([
    ['es', 'Saltar al contenido principal'],
    ['en', 'Skip to main content'],
    ['pt', 'Pular para o conteúdo principal'],
  ] as const)('targets the main content in %s', (locale, label) => {
    render(<SkipLink />, { locale });
    const link = screen.getByRole('link', { name: label });
    expect(link).toHaveAttribute('href', '#main-content');
    // `.skip-link` alone: the old `sr-only-focusable` turned it static on focus,
    // dropping it into the flow under the fixed navbar.
    expect(link).toHaveClass('skip-link');
    expect(link).not.toHaveClass('sr-only-focusable');
  });
});
