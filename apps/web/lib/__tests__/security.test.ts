import { describe, it, expect, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

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
// Imports (after mocks so module resolution picks up stubs)
// ---------------------------------------------------------------------------

import {
  timingSafeEqual,
  validateBearerToken,
  generateHmacSignature,
  verifyHmacSignature,
  validateWebhookSignature,
  generateSecureToken,
  sha256Hash,
  isValidApiKeyFormat,
  encryptData,
  decryptData,
} from '../security';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('security utilities', () => {
  // -----------------------------------------------------------------------
  // timingSafeEqual
  // -----------------------------------------------------------------------

  describe('timingSafeEqual', () => {
    it('returns true for equal strings', () => {
      expect(timingSafeEqual('secret-value', 'secret-value')).toBe(true);
    });

    it('returns false for different strings of the same length', () => {
      expect(timingSafeEqual('aaaa-bbbb-cccc', 'xxxx-yyyy-zzzz')).toBe(false);
    });

    it('returns false for strings of different lengths without timing leak', () => {
      // The implementation performs a dummy comparison to avoid early-return
      // timing differences, so this must still return false safely.
      expect(timingSafeEqual('short', 'a-much-longer-string')).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // validateBearerToken
  // -----------------------------------------------------------------------

  describe('validateBearerToken', () => {
    const secret = 'my-super-secret-token-value-1234';

    it('returns true for a valid Bearer header matching the secret', () => {
      expect(validateBearerToken(`Bearer ${secret}`, secret)).toBe(true);
    });

    it('returns false when the header is null', () => {
      expect(validateBearerToken(null, secret)).toBe(false);
    });

    it('returns false for a malformed authorization scheme', () => {
      expect(validateBearerToken(`Basic ${secret}`, secret)).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // HMAC signing & verification
  // -----------------------------------------------------------------------

  describe('generateHmacSignature / verifyHmacSignature', () => {
    const payload = '{"event":"deploy","id":42}';
    const secret = 'webhook-secret';

    it('generates a hex signature and verifies it successfully', () => {
      const signature = generateHmacSignature(payload, secret);

      // Hex string of SHA-256 HMAC is 64 characters
      expect(signature).toMatch(/^[0-9a-f]{64}$/);
      expect(verifyHmacSignature(payload, signature, secret)).toBe(true);
    });

    it('rejects a tampered signature', () => {
      const signature = generateHmacSignature(payload, secret);
      const tampered = signature.replace(signature[0], signature[0] === 'a' ? 'b' : 'a');

      expect(verifyHmacSignature(payload, tampered, secret)).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // validateWebhookSignature
  // -----------------------------------------------------------------------

  describe('validateWebhookSignature', () => {
    const payload = '{"action":"push"}';
    const secret = 'gh-webhook-secret';

    it('returns false when the signature header is null', () => {
      expect(validateWebhookSignature(payload, null, secret)).toBe(false);
    });

    it('validates a signature that includes a prefix like "sha256="', () => {
      const rawSignature = generateHmacSignature(payload, secret);
      const headerValue = `sha256=${rawSignature}`;

      expect(
        validateWebhookSignature(payload, headerValue, secret, {
          algorithm: 'sha256',
          prefix: 'sha256=',
        })
      ).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // generateSecureToken
  // -----------------------------------------------------------------------

  describe('generateSecureToken', () => {
    it('returns a hex string whose length is twice the byte length', () => {
      const token = generateSecureToken(32);

      // 32 random bytes encoded as hex = 64 hex characters
      expect(token).toHaveLength(64);
      expect(token).toMatch(/^[0-9a-f]+$/);
    });

    it('produces unique tokens on successive calls', () => {
      const tokenA = generateSecureToken();
      const tokenB = generateSecureToken();

      expect(tokenA).not.toBe(tokenB);
    });
  });

  // -----------------------------------------------------------------------
  // sha256Hash
  // -----------------------------------------------------------------------

  describe('sha256Hash', () => {
    it('is deterministic: same input always yields the same hash', () => {
      const input = 'consistent-input-value';
      const first = sha256Hash(input);
      const second = sha256Hash(input);

      expect(first).toBe(second);
      // SHA-256 in hex is 64 characters
      expect(first).toMatch(/^[0-9a-f]{64}$/);
    });
  });

  // -----------------------------------------------------------------------
  // isValidApiKeyFormat
  // -----------------------------------------------------------------------

  describe('isValidApiKeyFormat', () => {
    it('accepts a valid key of 32+ alphanumeric/underscore/hyphen characters', () => {
      const validKey = 'abcdefghijklmnopqrstuvwxyz012345'; // exactly 32 chars
      expect(isValidApiKeyFormat(validKey)).toBe(true);

      const longerKey = 'ABCDEF_ghijkl-mnopqr_stuvwx-yz012345678';
      expect(isValidApiKeyFormat(longerKey)).toBe(true);
    });

    it('rejects a key shorter than 32 characters', () => {
      expect(isValidApiKeyFormat('too-short')).toBe(false);
    });

    it('rejects a key containing disallowed special characters', () => {
      // 32 chars but includes '!' and '@'
      const badKey = 'abcdefghijklmnopqrstuvwxyz0123!@';
      expect(isValidApiKeyFormat(badKey)).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // encryptData / decryptData
  // -----------------------------------------------------------------------

  describe('encryptData / decryptData', () => {
    const plaintext = 'sensitive-user-data-to-protect';
    const key = 'encryption-key-for-aes-256-gcm';

    it('round-trips data: encrypt then decrypt returns the original plaintext', () => {
      const { encrypted, iv, tag } = encryptData(plaintext, key);

      // All outputs must be hex strings
      expect(encrypted).toMatch(/^[0-9a-f]+$/);
      expect(iv).toMatch(/^[0-9a-f]{32}$/); // 16 bytes = 32 hex chars
      expect(tag).toMatch(/^[0-9a-f]{32}$/); // GCM tag = 16 bytes = 32 hex chars

      const decrypted = decryptData(encrypted, iv, tag, key);
      expect(decrypted).toBe(plaintext);
    });

    it('throws when decrypting with the wrong key', () => {
      const { encrypted, iv, tag } = encryptData(plaintext, key);

      expect(() => decryptData(encrypted, iv, tag, 'wrong-key')).toThrow('Decryption failed');
    });
  });
});
