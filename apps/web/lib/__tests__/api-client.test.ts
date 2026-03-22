import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks — vi.hoisted ensures these are available when vi.mock factories run
// ---------------------------------------------------------------------------

const mockEnvironment = vi.hoisted(() => ({
  isDevelopment: false,
  isStaging: false,
  isStaticExport: false,
  api: { baseUrl: '/api' },
}));

vi.mock('../environment', () => ({
  environment: mockEnvironment,
}));

vi.mock('@madfam/core', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    trace: vi.fn(),
    withContext: vi.fn(() => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    })),
  },
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    trace: vi.fn(),
    withContext: vi.fn(() => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    })),
  })),
  LogLevel: { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 },
}));

vi.mock('@/lib/logger', () => ({
  apiLogger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { ApiClient } from '../api-client';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockFetch = vi.fn();

function makeFetchResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
    headers: new Headers(),
    statusText: 'OK',
  } as unknown as Response;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ApiClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
    globalThis.fetch = mockFetch;

    // Reset environment to production/non-mock mode
    mockEnvironment.isDevelopment = false;
    mockEnvironment.isStaging = false;
    mockEnvironment.isStaticExport = false;
    mockEnvironment.api.baseUrl = '/api';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // =========================================================================
  // submitLead
  // =========================================================================

  describe('submitLead', () => {
    const leadData = {
      name: 'Jane Doe',
      email: 'jane@example.com',
      company: 'Acme Corp',
      message: 'Interested in consulting',
      source: 'website',
    };

    it('returns mock data when in static export mode', async () => {
      mockEnvironment.isStaticExport = true;
      const client = new ApiClient();

      const result = await client.submitLead(leadData);

      expect(result).toMatchObject({
        success: true,
        leadId: 'mock-lead-123',
        score: 75,
      });
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('sends POST to /leads in production mode', async () => {
      const responseBody = { success: true, leadId: 'real-123', score: 90 };
      mockFetch.mockResolvedValueOnce(makeFetchResponse(responseBody));
      const client = new ApiClient();

      const result = await client.submitLead(leadData);

      expect(mockFetch).toHaveBeenCalledWith('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadData),
      });
      expect(result).toEqual(responseBody);
    });

    it('throws on non-ok response', async () => {
      mockFetch.mockResolvedValueOnce(makeFetchResponse({}, 500));
      const client = new ApiClient();

      await expect(client.submitLead(leadData)).rejects.toThrow('API error: 500');
    });
  });

  // =========================================================================
  // submitAssessment
  // =========================================================================

  describe('submitAssessment', () => {
    const assessmentData = {
      sessionId: 'session-abc',
      answers: [{ questionId: 'q1', value: 'high', timestamp: '2026-01-01T00:00:00Z' }],
      metadata: {
        startTime: '2026-01-01T00:00:00Z',
        userAgent: 'test',
        locale: 'en',
        source: 'website',
      },
    };

    it('returns mock data when in static export mode', async () => {
      mockEnvironment.isStaticExport = true;
      const client = new ApiClient();

      const result = await client.submitAssessment(assessmentData);

      expect(result).toMatchObject({
        success: true,
        assessmentId: 'mock-assessment-123',
        results: expect.objectContaining({ score: 68 }),
      });
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('sends POST to /assessment in production mode', async () => {
      const responseBody = { success: true, sessionId: 'real-session' };
      mockFetch.mockResolvedValueOnce(makeFetchResponse(responseBody));
      const client = new ApiClient();

      const result = await client.submitAssessment(assessmentData);

      expect(mockFetch).toHaveBeenCalledWith('/api/assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assessmentData),
      });
      expect(result).toEqual(responseBody);
    });

    it('throws on non-ok response', async () => {
      mockFetch.mockResolvedValueOnce(makeFetchResponse({}, 403));
      const client = new ApiClient();

      await expect(client.submitAssessment(assessmentData)).rejects.toThrow('API error: 403');
    });
  });

  // =========================================================================
  // getAssessmentQuestions
  // =========================================================================

  describe('getAssessmentQuestions', () => {
    it('returns mock questions when in static export mode', async () => {
      mockEnvironment.isStaticExport = true;
      const client = new ApiClient();

      const result = await client.getAssessmentQuestions();

      expect(result.questions).toHaveLength(5);
      expect(result.totalQuestions).toBe(5);
      expect(result.questions[0]).toMatchObject({
        id: 'q1',
        category: 'technology',
        weight: 3,
      });
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('sends GET to /assessment in production mode', async () => {
      const responseBody = { questions: [], totalQuestions: 0 };
      mockFetch.mockResolvedValueOnce(makeFetchResponse(responseBody));
      const client = new ApiClient();

      const result = await client.getAssessmentQuestions();

      expect(mockFetch).toHaveBeenCalledWith('/api/assessment');
      expect(result).toEqual(responseBody);
    });

    it('throws on non-ok response', async () => {
      mockFetch.mockResolvedValueOnce(makeFetchResponse({}, 404));
      const client = new ApiClient();

      await expect(client.getAssessmentQuestions()).rejects.toThrow('API error: 404');
    });
  });

  // =========================================================================
  // calculateROI
  // =========================================================================

  describe('calculateROI', () => {
    const roiData = {
      currentState: {
        revenue: 1000000,
        costs: 500000,
        teamSize: 10,
        timeToMarket: 6,
        efficiencyScore: 60,
      },
      targetState: {
        revenueIncrease: 30,
        costReduction: 20,
        productivityGain: 40,
        timeReduction: 25,
      },
      investment: {
        initialCost: 100000,
        monthlyRecurring: 5000,
        implementationTime: 3,
      },
      assumptions: {
        discountRate: 10,
        projectDuration: 36,
        riskFactor: 15,
      },
    };

    it('returns mock calculator data when in static export mode', async () => {
      mockEnvironment.isStaticExport = true;
      const client = new ApiClient();

      const result = await client.calculateROI(roiData);

      expect(result).toMatchObject({
        success: true,
        calculationId: 'mock-calc-123',
        results: expect.objectContaining({
          roi: expect.objectContaining({ percentage: 120, paybackMonths: 8 }),
        }),
      });
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('sends POST to /calculator with type roi in production mode', async () => {
      const responseBody = { success: true, calculations: {} };
      mockFetch.mockResolvedValueOnce(makeFetchResponse(responseBody));
      const client = new ApiClient();

      const result = await client.calculateROI(roiData);

      expect(mockFetch).toHaveBeenCalledWith('/api/calculator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...roiData, type: 'roi' }),
      });
      expect(result).toEqual(responseBody);
    });

    it('throws on non-ok response', async () => {
      mockFetch.mockResolvedValueOnce(makeFetchResponse({}, 502));
      const client = new ApiClient();

      await expect(client.calculateROI(roiData)).rejects.toThrow('API error: 502');
    });
  });

  // =========================================================================
  // calculateProjectEstimate
  // =========================================================================

  describe('calculateProjectEstimate', () => {
    const estimateData = {
      project: {
        name: 'Test Project',
        description: 'A test project',
        type: 'web' as const,
        industry: 'technology',
        urgency: 'standard' as const,
      },
      requirements: [],
      preferences: {
        budget: { min: 50000, max: 200000, preferred: 100000 },
        timeline: { desired: 6, flexible: true },
        team: { size: 'medium' as const, experience: 'senior' as const },
        technology: { preferences: ['React', 'Node.js'], constraints: [] },
      },
      contact: {
        name: 'Jane Doe',
        email: 'jane@example.com',
        message: 'Estimate request',
        source: 'website',
      },
    };

    it('returns mock estimate data when in static export mode', async () => {
      mockEnvironment.isStaticExport = true;
      const client = new ApiClient();

      const result = await client.calculateProjectEstimate(estimateData);

      expect(result).toMatchObject({
        success: true,
        data: expect.objectContaining({
          estimateId: 'mock-estimate-123',
          summary: expect.objectContaining({
            totalHours: 800,
            totalCost: 232000,
            duration: 8,
            confidence: 85,
          }),
        }),
      });
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('sends POST to /calculator with type project_estimate in production mode', async () => {
      const responseBody = { success: true, data: { estimateId: 'real-est-1' } };
      mockFetch.mockResolvedValueOnce(makeFetchResponse(responseBody));
      const client = new ApiClient();

      const result = await client.calculateProjectEstimate(estimateData);

      expect(mockFetch).toHaveBeenCalledWith('/api/calculator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...estimateData, type: 'project_estimate' }),
      });
      expect(result).toEqual(responseBody);
    });

    it('throws on non-ok response', async () => {
      mockFetch.mockResolvedValueOnce(makeFetchResponse({}, 500));
      const client = new ApiClient();

      await expect(client.calculateProjectEstimate(estimateData)).rejects.toThrow('API error: 500');
    });
  });
});
