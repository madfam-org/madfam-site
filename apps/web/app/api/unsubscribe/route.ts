import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/unsubscribe
 *
 * Processes email unsubscribe requests. Records the opt-out and
 * optionally notifies PhyndCRM to suppress future marketing sends.
 *
 * CAN-SPAM / LFPDPPP compliant: accepts email, logs the preference,
 * returns success. The actual suppression is enforced at send-time
 * by checking the suppression list before dispatching via Resend.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = body?.email?.trim()?.toLowerCase();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email address is required' }, { status: 400 });
    }

    // Log the unsubscribe (server-side, always succeeds).
    // Strip CR/LF/control chars before logging to prevent log-injection (CWE-117).
    // Use `%s` format directive so the value can never be parsed as a format string.
    const sanitizeForLog = (s: string): string =>
      // eslint-disable-next-line no-control-regex
      s.replace(/[\x00-\x1F\x7F]/g, '');
    const localPrefix = sanitizeForLog(email.slice(0, 3));
    const domain = sanitizeForLog(email.split('@')[1] ?? '');
    console.info('[unsubscribe] Email opt-out recorded: %s***@%s', localPrefix, domain);

    // Notify PhyndCRM to suppress future sends (best-effort)
    const crmUrl = process.env.PHYNE_CRM_URL;
    const crmToken = process.env.PHYNE_CRM_TOKEN;
    if (crmUrl && crmToken) {
      try {
        await fetch(`${crmUrl}/api/trpc/contacts.unsubscribe`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${crmToken}`,
          },
          body: JSON.stringify({ email }),
          signal: AbortSignal.timeout(5000),
        });
      } catch {
        // CRM notification is best-effort — unsubscribe succeeds regardless
        console.warn('[unsubscribe] PhyndCRM notification failed (non-blocking)');
      }
    }

    // Add to Resend suppression list if API key available
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      try {
        await fetch('https://api.resend.com/audiences/global/contacts', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, unsubscribed: true }),
          signal: AbortSignal.timeout(5000),
        });
      } catch {
        console.warn('[unsubscribe] Resend suppression failed (non-blocking)');
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
