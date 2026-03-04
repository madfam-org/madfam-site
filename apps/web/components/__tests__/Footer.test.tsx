import { Footer } from '../Footer';
import { render, screen } from '@/test-utils/providers';

describe('Footer', () => {
  it('should display the current year dynamically', () => {
    const currentYear = new Date().getFullYear();

    render(<Footer />, { locale: 'en' });

    // Check if the current year is displayed
    const copyrightText = screen.getByText(new RegExp(`© ${currentYear} MADFAM`, 'i'));
    expect(copyrightText).toBeInTheDocument();
  });

  it('should render footer with copyright containing a 4-digit year', () => {
    render(<Footer />, { locale: 'en' });

    // Verify the copyright text contains a valid year format
    const copyrightText = screen.getByText(/© \d{4} MADFAM/i);
    expect(copyrightText).toBeInTheDocument();
  });
});
