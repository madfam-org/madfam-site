/**
 * Campaign attribution for leads.
 *
 * The leads API already stores `metadata.utm_source|utm_medium|utm_campaign`
 * on the Lead row (`utmSource`, `utmMedium`, `utmCampaign`), but no form sent
 * them: a visitor lands on `/es?utm_source=…`, moves to `/es/contact`, and the
 * query is gone by the time the form is posted.
 *
 * So the landing page's `utm_*` parameters are kept in sessionStorage for the
 * tab's session (first campaign touch wins, like Dhanam's set-once
 * attribution) and merged into the lead's metadata on submit. Only the five
 * standard campaign parameters are kept; nothing identifies the visitor.
 */

export const UTM_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
] as const;
export type UtmKey = (typeof UTM_KEYS)[number];
export type Utm = Partial<Record<UtmKey, string>>;

export const UTM_STORAGE_KEY = 'madfam.utm';
const MAX_VALUE_LENGTH = 200;

type KeyValueStore = Pick<Storage, 'getItem' | 'setItem'>;

/** The campaign parameters in a query string, trimmed and length-capped. */
export function pickUtm(search: string): Utm {
  const params = new URLSearchParams(search);
  const utm: Utm = {};
  for (const key of UTM_KEYS) {
    const value = params.get(key)?.trim();
    if (value) utm[key] = value.slice(0, MAX_VALUE_LENGTH);
  }
  return utm;
}

function isEmpty(utm: Utm): boolean {
  return Object.keys(utm).length === 0;
}

/** The stored first touch, or `{}` when none (or storage is unusable). */
export function storedUtm(storage: KeyValueStore | undefined): Utm {
  if (!storage) return {};
  try {
    const raw = storage.getItem(UTM_STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    const utm: Utm = {};
    for (const key of UTM_KEYS) {
      const value = (parsed as Record<string, unknown>)[key];
      if (typeof value === 'string' && value) utm[key] = value.slice(0, MAX_VALUE_LENGTH);
    }
    return utm;
  } catch {
    return {};
  }
}

/** Keeps the page's campaign parameters unless a first touch is already stored. */
export function rememberUtm(search: string, storage: KeyValueStore | undefined): void {
  if (!storage) return;
  const utm = pickUtm(search);
  if (isEmpty(utm) || !isEmpty(storedUtm(storage))) return;
  try {
    storage.setItem(UTM_STORAGE_KEY, JSON.stringify(utm));
  } catch {
    // Storage full or blocked: attribution is best effort, the lead still posts.
  }
}

/**
 * What a lead carries: the stored first touch, or failing that the current
 * page's parameters.
 */
export function leadUtm(search: string, storage: KeyValueStore | undefined): Utm {
  const stored = storedUtm(storage);
  return isEmpty(stored) ? pickUtm(search) : stored;
}

/** sessionStorage, or undefined where the browser blocks it. */
export function sessionStore(): KeyValueStore | undefined {
  try {
    return typeof window === 'undefined' ? undefined : window.sessionStorage;
  } catch {
    return undefined;
  }
}
