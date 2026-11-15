import { describe, expect, it } from 'vitest';
import {
  REFERRER_STORAGE_KEY,
  UTM_STORAGE_KEY,
  leadUtm,
  pickReferrer,
  pickUtm,
  rememberReferrer,
  rememberUtm,
  storedReferrer,
  storedUtm,
} from '../attribution';

const OWN_ORIGIN = 'https://site.example.test';

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

describe('pickReferrer', () => {
  it('keeps an external http(s) referrer as origin + path, without query or fragment', () => {
    expect(pickReferrer('https://news.example.test/post?id=7&email=a@b.c#top', OWN_ORIGIN)).toBe(
      'https://news.example.test/post'
    );
    expect(pickReferrer('https://www.search.example/', OWN_ORIGIN)).toBe(
      'https://www.search.example'
    );
  });

  it('drops an empty, internal or non-http referrer', () => {
    expect(pickReferrer('', OWN_ORIGIN)).toBeUndefined();
    expect(pickReferrer(`${OWN_ORIGIN}/es/pricing`, OWN_ORIGIN)).toBeUndefined();
    expect(pickReferrer('android-app://com.example.app/', OWN_ORIGIN)).toBeUndefined();
    expect(pickReferrer('not a url', OWN_ORIGIN)).toBeUndefined();
  });

  it('caps a long referrer like a campaign value', () => {
    expect(pickReferrer(`https://news.example.test/${'p'.repeat(300)}`, OWN_ORIGIN)).toHaveLength(
      200
    );
  });
});

describe('rememberReferrer / storedReferrer', () => {
  it('keeps the first external referrer of the session', () => {
    const store = memoryStore();
    rememberReferrer(`${OWN_ORIGIN}/es`, OWN_ORIGIN, store);
    expect(storedReferrer(store)).toBeUndefined();
    rememberReferrer('https://news.example.test/post', OWN_ORIGIN, store);
    rememberReferrer('https://other.example.test/', OWN_ORIGIN, store);
    expect(storedReferrer(store)).toBe('https://news.example.test/post');
    expect(store.data.get(REFERRER_STORAGE_KEY)).toBe('https://news.example.test/post');
  });

  it('is undefined without storage or with storage that throws', () => {
    expect(storedReferrer(undefined)).toBeUndefined();
    const broken = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    };
    expect(storedReferrer(broken)).toBeUndefined();
    expect(() => rememberReferrer('https://news.example.test/', OWN_ORIGIN, broken)).not.toThrow();
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
