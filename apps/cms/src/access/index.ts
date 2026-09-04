import type { Access } from 'payload';

/** Anyone, authenticated or not. Use only for collections with no draft state. */
export const anyone: Access = () => true;

/** Any logged-in CMS user. */
export const authenticated: Access = ({ req: { user } }) => Boolean(user);

/** Logged-in admins only. */
export const adminOnly: Access = ({ req: { user } }) => user?.role === 'admin';

/**
 * Public reads see published documents only; drafts stay invisible until a user
 * is logged in. Requires `versions: { drafts: true }` on the collection so that
 * `_status` exists.
 */
export const publishedOrAuthenticated: Access = ({ req: { user } }) => {
  if (user) return true;
  return { _status: { equals: 'published' } };
};
