import { analytics } from '@madfam/analytics';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, type MockedFunction } from 'vitest';
import { LeadForm } from '../LeadForm';
import { apiClient } from '@/lib/api-client';
import { render, screen, waitFor } from '@/test-utils/providers';

// Mock the API client
vi.mock('@/lib/api-client', () => ({
  apiClient: {
    submitLead: vi.fn(),
  },
}));

// Mock the analytics
vi.mock('@madfam/analytics', () => ({
  analytics: {
    trackLeadFormSubmitted: vi.fn(),
  },
}));

describe('LeadForm Component', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render all form fields', () => {
    render(<LeadForm />);

    expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/empresa/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/teléfono/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/mensaje/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /enviar consulta/i })).toBeInTheDocument();
  });

  it('should show validation errors for required fields', async () => {
    render(<LeadForm />);

    const submitButton = screen.getByRole('button', { name: /enviar consulta/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/el nombre es requerido/i)).toBeInTheDocument();
      expect(screen.getByText(/el email es requerido/i)).toBeInTheDocument();
    });
  });

  it('should validate email format', async () => {
    render(<LeadForm />);

    const emailInput = screen.getByLabelText(/email/i);
    await user.type(emailInput, 'invalid-email');

    const submitButton = screen.getByRole('button', { name: /enviar consulta/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/email inválido/i)).toBeInTheDocument();
    });
  });

  it('should submit form with valid data', async () => {
    const mockResponse = {
      success: true,
      leadId: 'test-lead-123',
      score: 75,
      message: 'Gracias por tu interés. Nos pondremos en contacto pronto.',
    };

    (apiClient.submitLead as MockedFunction<typeof apiClient.submitLead>).mockResolvedValueOnce(
      mockResponse
    );

    render(<LeadForm />);

    // Fill in the form
    await user.type(screen.getByLabelText(/nombre/i), 'Juan Pérez');
    await user.type(screen.getByLabelText(/email/i), 'juan@empresa.com');
    await user.type(screen.getByLabelText(/empresa/i), 'Tech Corp');
    await user.type(screen.getByLabelText(/teléfono/i), '+525512345678');
    await user.type(
      screen.getByLabelText(/mensaje/i),
      'Estamos interesados en servicios de consultoría'
    );

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /enviar consulta/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(apiClient.submitLead).toHaveBeenCalledWith({
        name: 'Juan Pérez',
        email: 'juan@empresa.com',
        company: 'Tech Corp',
        phone: '+525512345678',
        message: 'Estamos interesados en servicios de consultoría',
        source: 'website',
        preferredLanguage: 'es-MX',
      });

      expect(analytics.trackLeadFormSubmitted).toHaveBeenCalled();
      expect(screen.getByText(mockResponse.message)).toBeInTheDocument();
    });
  });

  it('should show loading state while submitting', async () => {
    // Make the API call take some time
    (apiClient.submitLead as MockedFunction<typeof apiClient.submitLead>).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
    );

    render(<LeadForm />);

    // Fill required fields
    await user.type(screen.getByLabelText(/nombre/i), 'Test User');
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');

    const submitButton = screen.getByRole('button', { name: /enviar consulta/i });
    await user.click(submitButton);

    // Check for loading state
    expect(submitButton).toHaveAttribute('disabled');
    expect(screen.getByText(/enviando/i)).toBeInTheDocument();
  });

  it('should handle API errors gracefully', async () => {
    const errorMessage = 'Error al procesar la solicitud';
    (apiClient.submitLead as MockedFunction<typeof apiClient.submitLead>).mockRejectedValueOnce(
      new Error(errorMessage)
    );

    render(<LeadForm />);

    // Fill and submit
    await user.type(screen.getByLabelText(/nombre/i), 'Test User');
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');

    const submitButton = screen.getByRole('button', { name: /enviar consulta/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(new RegExp(errorMessage, 'i'))).toBeInTheDocument();
    });
  });

  it('should reset form after successful submission', async () => {
    (apiClient.submitLead as MockedFunction<typeof apiClient.submitLead>).mockResolvedValueOnce({
      success: true,
      leadId: 'test-123',
    });

    render(<LeadForm />);

    const nameInput = screen.getByLabelText(/nombre/i) as HTMLInputElement;
    const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;

    await user.type(nameInput, 'Test User');
    await user.type(emailInput, 'test@example.com');

    await user.click(screen.getByRole('button', { name: /enviar consulta/i }));

    await waitFor(() => {
      expect(nameInput.value).toBe('');
      expect(emailInput.value).toBe('');
    });
  });
});
