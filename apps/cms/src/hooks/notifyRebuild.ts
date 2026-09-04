import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionConfig,
  Payload,
} from 'payload';

const WEBHOOK_TIMEOUT_MS = 5000;

type Notification = {
  collection: string;
  operation: 'create' | 'update' | 'delete';
  id?: string;
};

/**
 * Calls the consumer's cache-invalidation webhook.
 *
 * Contract (apps/web/app/api/webhook/cms/route.ts):
 *   POST { collection, operation, id } with an `x-webhook-secret` header.
 *
 * Never throws and never logs the URL or the secret: a failed rebuild ping must
 * not fail an editor's save, and neither value belongs in a log line.
 */
const notify = async (payload: Payload, body: Notification): Promise<void> => {
  const url = process.env.CMS_REBUILD_WEBHOOK_URL;
  const secret = process.env.CMS_WEBHOOK_SECRET;

  if (!url || !secret) {
    payload.logger.debug(
      'CMS rebuild webhook not configured (CMS_REBUILD_WEBHOOK_URL / CMS_WEBHOOK_SECRET); skipping'
    );
    return;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-secret': secret,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(WEBHOOK_TIMEOUT_MS),
    });

    if (!response.ok) {
      payload.logger.warn(
        `CMS rebuild webhook returned ${response.status} for ${body.collection}/${body.operation}`
      );
    }
  } catch (error) {
    payload.logger.warn(
      `CMS rebuild webhook failed for ${body.collection}/${body.operation}: ${
        error instanceof Error ? error.message : 'unknown error'
      }`
    );
  }
};

const afterChange: CollectionAfterChangeHook = async ({ collection, doc, operation, req }) => {
  await notify(req.payload, {
    collection: collection.slug,
    operation,
    id: doc?.id ? String(doc.id) : undefined,
  });
  return doc;
};

const afterDelete: CollectionAfterDeleteHook = async ({ collection, doc, id, req }) => {
  await notify(req.payload, {
    collection: collection.slug,
    operation: 'delete',
    id: id !== undefined && id !== null ? String(id) : undefined,
  });
  return doc;
};

/** Adds the rebuild webhook hooks to a collection, preserving its own hooks. */
export const withRebuildWebhook = (collection: CollectionConfig): CollectionConfig => ({
  ...collection,
  hooks: {
    ...collection.hooks,
    afterChange: [...(collection.hooks?.afterChange ?? []), afterChange],
    afterDelete: [...(collection.hooks?.afterDelete ?? []), afterDelete],
  },
});
