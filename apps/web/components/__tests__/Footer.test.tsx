import { Footer } from '../Footer';
import { render, screen } from '@/test-utils/providers';

describe('Footer', () => {
  it('should display the current year dynamically', () => {
    const currentYear = new Date().getFullYear();

    render(<Footer />, { locale: 'en' });

    // Check if the current year is displayed
    const copyrightText = screen.getByText(
      new RegExp(`© ${currentYear} Innovaciones MADFAM S\\.A\\.S\\. de C\\.V\\.`, 'i')
    );
    expect(copyrightText).toBeInTheDocument();
  });

  // R47/C-013: the copyright line carries the legal entity and its domicile.
  it('should render footer with copyright containing a 4-digit year', () => {
    render(<Footer />, { locale: 'en' });

    // Verify the copyright text contains a valid year format
    const copyrightText = screen.getByText(
      /© \d{4} Innovaciones MADFAM S\.A\.S\. de C\.V\. · Cuernavaca, Morelos/i
    );
    expect(copyrightText).toBeInTheDocument();
  });

  // Owner ruling 2026-10-28: a curated platform column closed by a link to the
  // full catalog, and Nauta named once.
  it('closes the curated platform column with a link to every platform', () => {
    render(<Footer />, { locale: 'en' });

    expect(screen.getByRole('link', { name: 'All platforms →' })).toHaveAttribute(
      'href',
      '/en/products'
    );
    expect(screen.getAllByRole('link', { name: /Nauta/ })).toHaveLength(1);
    expect(screen.queryByRole('link', { name: 'Janua' })).not.toBeInTheDocument();
  });
});
