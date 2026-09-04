import type { CollectionBeforeChangeHook } from 'payload';

/**
 * Keeps the legacy `status` select in sync with Payload's `_status`.
 *
 * Drafts are now Payload-native (`versions: { drafts: true }`), but the site's
 * CMS client still filters with `where[status][equals]=published`
 * (apps/web/lib/cms/client.ts). Mirroring keeps that query valid instead of
 * returning a 400 for an unknown path; the field is hidden in the admin UI so
 * editors only ever see the real draft/publish control. Retire it once the
 * consumer moves to `_status`.
 */
export const mirrorDraftStatus: CollectionBeforeChangeHook = ({ data }) => ({
  ...data,
  status: data?._status === 'published' ? 'published' : 'draft',
});
