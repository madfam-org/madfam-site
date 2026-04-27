/**
 * Utility Types and Helper Functions
 * Common utility types and type guards for the application
 */

// Utility function types
export type ThrottledFunction<T extends (...args: unknown[]) => unknown> = T & {
  cancel?: () => void;
};

export interface ThrottleOptions {
  leading?: boolean;
  trailing?: boolean;
}

// Function type for throttle utility
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number,
  _options?: ThrottleOptions
): ThrottledFunction<T> {
  let inThrottle: boolean;
  let lastFunc: ReturnType<typeof setTimeout>;
  let lastRan: number;

  const throttled = function (this: ThisParameterType<T>, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      lastRan = Date.now();
      inThrottle = true;
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(
        () => {
          if (Date.now() - lastRan >= limit) {
            func.apply(this, args);
            lastRan = Date.now();
          }
        },
        limit - (Date.now() - lastRan)
      );
    }
  } as ThrottledFunction<T>;

  throttled.cancel = () => {
    clearTimeout(lastFunc);
    inThrottle = false;
  };

  return throttled;
}

// Debounce function type
export type DebouncedFunction<T extends (...args: unknown[]) => unknown> = T & {
  cancel?: () => void;
  flush?: () => ReturnType<T> | undefined;
};

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): DebouncedFunction<T> {
  let timeoutId: ReturnType<typeof setTimeout>;
  let lastArgs: Parameters<T>;
  let lastThis: ThisParameterType<T>;

  const debounced = function (this: ThisParameterType<T>, ...args: Parameters<T>) {
    lastArgs = args;
    lastThis = this;

    clearTimeout(timeoutId);

    timeoutId = setTimeout(() => {
      func.apply(lastThis, lastArgs);
    }, delay);
  } as DebouncedFunction<T>;

  debounced.cancel = () => {
    clearTimeout(timeoutId);
  };

  debounced.flush = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      return func.apply(lastThis, lastArgs);
    }
    return undefined;
  };

  return debounced;
}

// Event handler types
export type EventHandler<T = Element, E = Event> = (
  event: E & { target: T; currentTarget: T }
) => void;

export type ChangeHandler<T = HTMLInputElement> = EventHandler<
  T,
  Event & { target: T & { value: string } }
>;

export type SubmitHandler<T = HTMLFormElement> = EventHandler<
  T,
  Event & { preventDefault: () => void }
>;

export type ClickHandler<T = HTMLElement> = EventHandler<T, MouseEvent>;

export type KeyboardHandler<T = HTMLElement> = EventHandler<T, KeyboardEvent>;

// Form validation types
export interface ValidationRule<T = unknown> {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: T) => boolean | string;
  message?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export type ValidatorFunction<T = unknown> = (
  value: T,
  rules?: ValidationRule<T>
) => ValidationResult;

// Type guards
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isArray<T>(value: unknown): value is T[] {
  return Array.isArray(value);
}

export function isDefined<T>(value: T | undefined | null): value is T {
  return value !== undefined && value !== null;
}

export function isFunction(value: unknown): value is Function {
  return typeof value === 'function';
}

// Environment type guards
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

export function isClient(): boolean {
  return typeof window !== 'undefined';
}

export function isServer(): boolean {
  return typeof window === 'undefined';
}

// Error types
export interface AppError extends Error {
  code?: string;
  statusCode?: number;
  context?: Record<string, unknown>;
}

export function createAppError(
  message: string,
  code?: string,
  statusCode?: number,
  context?: Record<string, unknown>
): AppError {
  const error = new Error(message) as AppError;
  error.code = code;
  error.statusCode = statusCode;
  error.context = context;
  return error;
}

// Promise utilities
export type PromiseValue<T> = T extends Promise<infer U> ? U : T;

export interface PromiseWithResolvers<T> {
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: unknown) => void;
}

export function withResolvers<T>(): PromiseWithResolvers<T> {
  let resolve: (value: T | PromiseLike<T>) => void;
  let reject: (reason?: unknown) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve: resolve!, reject: reject! };
}

// Local storage utilities
export type StorageValue = string | number | boolean | object | null;

export interface StorageItem<T = StorageValue> {
  value: T;
  timestamp: number;
  ttl?: number;
}

export function getStorageItem<T = StorageValue>(key: string, defaultValue?: T): T | undefined {
  if (!isClient()) return defaultValue;

  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;

    const parsed: StorageItem<T> = JSON.parse(item);

    // Check TTL
    if (parsed.ttl && Date.now() > parsed.timestamp + parsed.ttl) {
      localStorage.removeItem(key);
      return defaultValue;
    }

    return parsed.value;
  } catch {
    return defaultValue;
  }
}

export function setStorageItem<T = StorageValue>(key: string, value: T, ttl?: number): void {
  if (!isClient()) return;

  try {
    const item: StorageItem<T> = {
      value,
      timestamp: Date.now(),
      ttl,
    };

    localStorage.setItem(key, JSON.stringify(item));
  } catch {
    // Storage quota exceeded or other error
  }
}

// URL utilities
export function getQueryParam(key: string, url?: string): string | null {
  if (!isClient() && !url) return null;

  const urlObj = new URL(url || window.location.href);
  return urlObj.searchParams.get(key);
}

export function setQueryParam(key: string, value: string, url?: string): string {
  const urlObj = new URL(url || (isClient() ? window.location.href : 'http://localhost'));
  urlObj.searchParams.set(key, value);
  return urlObj.toString();
}

// Deep merge utility
// Keys that, if copied from an attacker-controlled source object, would
// pollute the prototype chain or shadow built-in methods. We refuse to
// copy these in deepMerge to mitigate CodeQL js/prototype-pollution-utility.
const FORBIDDEN_PROTOTYPE_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

export function deepMerge<T extends Record<string, unknown>>(
  target: T,
  ...sources: Partial<T>[]
): T {
  if (!sources.length) return target;

  const source = sources.shift();
  if (!source) return target;

  for (const key in source) {
    // Skip inherited properties and dangerous prototype keys.
    if (!Object.prototype.hasOwnProperty.call(source, key)) continue;
    if (FORBIDDEN_PROTOTYPE_KEYS.has(key)) continue;

    const sourceValue = source[key];
    const targetValue = target[key];

    if (isObject(sourceValue) && isObject(targetValue)) {
      target[key] = deepMerge(
        targetValue as Record<string, unknown>,
        sourceValue as Record<string, unknown>
      ) as T[Extract<keyof T, string>];
    } else if (sourceValue !== undefined) {
      target[key] = sourceValue as T[Extract<keyof T, string>];
    }
  }

  return deepMerge(target, ...sources);
}

// CSS class utilities
export type ClassValue = string | number | boolean | undefined | null | ClassValue[];

export function classNames(...classes: ClassValue[]): string {
  return classes.flat().filter(Boolean).join(' ');
}

// Format utilities
export function formatCurrency(amount: number, currency = 'USD', locale = 'en'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
}

export function formatNumber(
  num: number,
  locale = 'en',
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat(locale, options).format(num);
}

export function formatDate(
  date: Date | string | number,
  locale = 'en',
  options?: Intl.DateTimeFormatOptions
): string {
  return new Intl.DateTimeFormat(locale, options).format(new Date(date));
}
