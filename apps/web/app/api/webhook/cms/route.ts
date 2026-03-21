import { NextRequest, NextResponse } from 'next/server';
import { CMSCache } from '@/lib/cms/cache';
import { apiLogger } from '@/lib/logger';

const cmsCache = new CMSCache();

/**
 * POST /api/webhook/cms
 *
 * Receives CMS change notifications and invalidates the relevant cache entries.
 * Authenticated via CMS_WEBHOOK_SECRET header.
 *
 * Body: { collection: string; operation: "create" | "update" | "delete"; id?: string }
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  // Authenticate
  const secret = process.env.CMS_WEBHOOK_SECRET;
  if (!secret) {
    apiLogger.warn('CMS webhook received but CMS_WEBHOOK_SECRET is not configured');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
  }

  const authHeader = request.headers.get('x-webhook-secret');
  if (authHeader !== secret) {
    apiLogger.warn('CMS webhook received with invalid secret');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { collection, operation, id } = body as {
      collection?: string;
      operation?: string;
      id?: string;
    };

    if (!collection) {
      return NextResponse.json({ error: 'Missing collection field' }, { status: 400 });
    }

    // Invalidate cache for the affected collection
    cmsCache.clear(collection);

    apiLogger.debug(
      `CMS cache invalidated: collection=${collection} operation=${operation || 'unknown'} id=${id || 'n/a'}`
    );

    return NextResponse.json({
      success: true,
      invalidated: collection,
      operation,
    });
  } catch (error) {
    apiLogger.error('CMS webhook processing error', error as Error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
