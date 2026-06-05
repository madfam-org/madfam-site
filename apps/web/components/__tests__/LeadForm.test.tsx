import { fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LeadForm } from '../LeadForm';
import { render, screen, waitFor } from '@/test-utils/providers';

// Mock fetch (component uses fetch('/api/leads'), not apiClient)
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock @madfam/core logger
vi.mock('@madfam/core', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    userAction: vi.fn(),
  },
}));

// Mock the analytics hooks used by the component
const mockTrackContactStarted = vi.fn();
const mockTrackContactCompleted = vi.fn();
const mockTrackLeadCaptured = vi.fn();
const mockTrackServiceFunnelStep = vi.fn();
const mockTrackError = vi.fn();

vi.mock('@madfam/analytics', () => ({
  useFormTracking: vi.fn(() => ({
    trackFieldInteraction: vi.fn(),
    trackFormStart: vi.fn(),
    trackFormComplete: vi.fn(),
    trackFormError: vi.fn(),
    trackContactStarted: mockTrackContactStarted,
    trackContactCompleted: mockTrackContactCompleted,
    trackLeadCaptured: mockTrackLeadCaptured,
  })),
  useConversionTracking: vi.fn(() => ({
    trackConversion: vi.fn(),
    trackLeadCapture: vi.fn(),
    trackServiceFunnelStep: mockTrackServiceFunnelStep,
    trackPurchaseIntent: vi.fn(),
  })),
  useErrorTracking: vi.fn(() => ({
    trackError: mockTrackError,
  })),
}));

describe('LeadForm Component', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  async function fillRequiredFields({
    message = 'Estamos interesados en servicios de consultoria de IA',
    intent = 'platform',
    timeline = '30-days',
    budget = '100k-500k-mxn',
    region = 'CDMX',
    followUp = 'email',
  } = {}) {
    await user.type(screen.getByLabelText(/nombre/i), 'Juan Perez');
    await user.type(screen.getByLabelText(/correo electr/i), 'juan@empresa.com');
    await user.selectOptions(screen.getByLabelText(/qué te trae/i), intent);
    await user.selectOptions(screen.getByLabelText(/tiempo estimado/i), timeline);
    await user.selectOptions(screen.getByLabelText(/presupuesto/i), budget);
    await user.type(screen.getByLabelText(/región/i), region);
    await user.selectOptions(screen.getByLabelText(/seguimiento preferido/i), followUp);
    await user.type(screen.getByLabelText(/cómo podemos ayudarte/i), message);
  }

  it('should render all form fields', () => {
    render(<LeadForm />);

    expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/correo electr/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/empresa/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/teléfono/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/qué te trae/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/tiempo estimado/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/presupuesto/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/región/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/seguimiento preferido/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/cómo podemos ayudarte/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /enviar consulta/i })).toBeInTheDocument();
  });

  it('should initialize intent from a valid offer-path query value', () => {
    render(<LeadForm initialIntent="partner-invest" />);

    expect(screen.getByLabelText(/qué te trae/i)).toHaveValue('partner-invest');
  });

  it('should show validation errors for required fields', async () => {
    render(<LeadForm />);

    const submitButton = screen.getByRole('button', { name: /enviar consulta/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/el nombre es requerido/i)).toBeInTheDocument();
      expect(screen.getByText(/email inv/i)).toBeInTheDocument();
      expect(screen.getByText(/selecciona un tiempo estimado/i)).toBeInTheDocument();
      expect(screen.getByText(/indica tu región/i)).toBeInTheDocument();
      expect(screen.getByText(/el mensaje es requerido/i)).toBeInTheDocument();
    });
  });

  it('should validate email format', async () => {
    render(<LeadForm />);

    // Fill name and message with valid data so only email error remains
    await user.type(screen.getByLabelText(/nombre/i), 'Test User');
    await user.type(screen.getByLabelText(/correo electr/i), 'invalid-email');
    await user.selectOptions(screen.getByLabelText(/tiempo estimado/i), 'quarter');
    await user.type(screen.getByLabelText(/región/i), 'CDMX');
    await user.type(
      screen.getByLabelText(/cómo podemos ayudarte/i),
      'This is a long enough test message'
    );

    // Use fireEvent.submit to bypass jsdom HTML5 constraint validation on
    // type="email" inputs. Native form submission via button click is blocked
    // by jsdom when the email input value fails HTML5 email pattern validation,
    // preventing react-hook-form from running its own zod-based validation.
    const form = document.querySelector('form');
    expect(form).not.toBeNull();
    fireEvent.submit(form as HTMLFormElement);

    await waitFor(() => {
      expect(screen.getByText(/email inv/i)).toBeInTheDocument();
    });
  });

  it('should submit form with valid data', async () => {
    const mockResponse = {
      success: true,
      leadId: 'test-lead-123',
    };

    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve(mockResponse),
    });

    render(<LeadForm />);

    await fillRequiredFields();

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /enviar consulta/i });
    await user.click(submitButton);

    await waitFor(() => {
      // Component calls fetch('/api/leads') with { ...data, source, preferredLanguage }
      expect(mockFetch).toHaveBeenCalledWith('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Juan Perez',
          email: 'juan@empresa.com',
          company: '',
          phone: '',
          message: 'Estamos interesados en servicios de consultoria de IA',
          metadata: {
            intent: 'platform',
            offerPath: 'platform',
            timeline: '30-days',
            budget: '100k-500k-mxn',
            region: 'CDMX',
            followUp: 'email',
          },
          source: 'website',
          preferredLanguage: 'es',
        }),
      });

      // Analytics hooks should have been called
      expect(mockTrackContactStarted).toHaveBeenCalledWith('lead-form');
      expect(mockTrackContactCompleted).toHaveBeenCalledWith('lead-form');
      expect(mockTrackLeadCaptured).toHaveBeenCalledWith({
        source: 'website',
        form: 'lead-form',
      });

      // Success message from t('messages.success')
      expect(screen.getByText(/gracias por tu inter/i)).toBeInTheDocument();
    });
  });

  it('should show loading state while submitting', async () => {
    // Make the fetch call take some time
    mockFetch.mockImplementation(
      () =>
        new Promise(resolve =>
          setTimeout(() => resolve({ json: () => Promise.resolve({ success: true }) }), 500)
        )
    );

    render(<LeadForm />);

    await fillRequiredFields({ message: 'This is a test message for the form' });

    const submitButton = screen.getByRole('button', { name: /enviar consulta/i });
    await user.click(submitButton);

    // Button should be disabled while submitting.
    // The Button component sets disabled when loading=true and renders a spinner SVG,
    // but the button text remains "Enviar consulta" (no separate loading text).
    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });
  });

  it('should handle API errors gracefully', async () => {
    // Component catches fetch errors and sets submitStatus to 'error'
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    render(<LeadForm />);

    await fillRequiredFields({ message: 'This is a test message for the form' });

    const submitButton = screen.getByRole('button', { name: /enviar consulta/i });
    await user.click(submitButton);

    await waitFor(() => {
      // Error message from t('messages.error') = "Ocurrió un error. Por favor intenta de nuevo."
      expect(screen.getByText(/ocurri.*error/i)).toBeInTheDocument();
    });
  });

  it('should handle non-success API response', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ success: false, error: 'Server error' }),
    });

    render(<LeadForm />);

    await fillRequiredFields({ message: 'This is a test message for the form' });

    await user.click(screen.getByRole('button', { name: /enviar consulta/i }));

    await waitFor(() => {
      expect(screen.getByText(/ocurri.*error/i)).toBeInTheDocument();
      expect(mockTrackError).toHaveBeenCalledWith(
        'Lead form submission failed',
        'form-submission',
        'medium'
      );
    });
  });

  it('should reset form after successful submission', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ success: true, leadId: 'test-123' }),
    });

    render(<LeadForm />);

    const nameInput = screen.getByLabelText(/nombre/i) as HTMLInputElement;
    const emailInput = screen.getByLabelText(/correo electr/i) as HTMLInputElement;
    const messageInput = screen.getByLabelText(/cómo podemos ayudarte/i) as HTMLTextAreaElement;

    await fillRequiredFields({ message: 'This is a test message for the form' });

    await user.click(screen.getByRole('button', { name: /enviar consulta/i }));

    await waitFor(() => {
      expect(nameInput.value).toBe('');
      expect(emailInput.value).toBe('');
      expect(messageInput.value).toBe('');
    });
  });

  it('should call onSuccess callback after successful submission', async () => {
    const onSuccess = vi.fn();

    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ success: true, leadId: 'test-123' }),
    });

    render(<LeadForm onSuccess={onSuccess} />);

    await fillRequiredFields({ message: 'This is a test message for the form' });

    await user.click(screen.getByRole('button', { name: /enviar consulta/i }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('should pass custom source prop to submission', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ success: true, leadId: 'test-123' }),
    });

    render(<LeadForm source="landing-page" />);

    await fillRequiredFields({ message: 'This is a test message for the form' });

    await user.click(screen.getByRole('button', { name: /enviar consulta/i }));

    await waitFor(() => {
      const fetchBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(fetchBody.source).toBe('landing-page');
    });
  });
});
