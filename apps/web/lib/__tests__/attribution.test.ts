import { describe, expect, it } from 'vitest';
import { UTM_STORAGE_KEY, leadUtm, pickUtm, rememberUtm, storedUtm } from '../attribution';

function memoryStore(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    data,
  };
}

describe('pickUtm', () => {
  it('keeps the five campaign parameters and nothing else', () => {
    expect(
      pickUtm(
        '?utm_source=newsletter&utm_medium=email&utm_campaign=oct&utm_term=erp&utm_content=hero&gclid=x&email=a@b.c'
      )
    ).toEqual({
      utm_source: 'newsletter',
      utm_medium: 'email',
      utm_campaign: 'oct',
      utm_term: 'erp',
      utm_content: 'hero',
    });
  });

  it('drops empty values and caps long ones', () => {
    const utm = pickUtm(`?utm_source=%20%20&utm_campaign=${'x'.repeat(300)}`);
    expect(utm.utm_source).toBeUndefined();
    expect(utm.utm_campaign).toHaveLength(200);
  });
});

describe('rememberUtm / leadUtm', () => {
  it('keeps the first campaign touch for the session', () => {
    const store = memoryStore();
    rememberUtm('?utm_source=linkedin&utm_campaign=launch', store);
    rememberUtm('?utm_source=google', store);
    expect(storedUtm(store)).toEqual({ utm_source: 'linkedin', utm_campaign: 'launch' });
  });

  it('stores nothing for a page without campaign parameters', () => {
    const store = memoryStore();
    rememberUtm('?intent=platform', store);
    expect(store.data.has(UTM_STORAGE_KEY)).toBe(false);
  });

  it('gives the lead the stored touch even after the query is gone', () => {
    const store = memoryStore();
    rememberUtm('?utm_source=newsletter&utm_medium=email', store);
    expect(leadUtm('', store)).toEqual({ utm_source: 'newsletter', utm_medium: 'email' });
  });

  it('falls back to the current page, then to nothing', () => {
    expect(leadUtm('?utm_source=direct-link', memoryStore())).toEqual({
      utm_source: 'direct-link',
    });
    expect(leadUtm('', memoryStore())).toEqual({});
    expect(leadUtm('', undefined)).toEqual({});
  });

  it('ignores a corrupted stored value', () => {
    expect(storedUtm(memoryStore({ [UTM_STORAGE_KEY]: '{not json' }))).toEqual({});
    expect(storedUtm(memoryStore({ [UTM_STORAGE_KEY]: '{"utm_source":7}' }))).toEqual({});
  });
});
