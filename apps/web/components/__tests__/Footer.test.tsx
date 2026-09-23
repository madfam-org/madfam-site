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
});
