#!/usr/bin/env node

/**
 * Find missing translations by scanning source files for common next-intl usage.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const TRANSLATIONS_DIR = path.join(ROOT, 'packages/i18n/src/translations');
const SCAN_DIRS = [path.join(ROOT, 'apps/web'), path.join(ROOT, 'packages')];
const LOCALES = ['es', 'en', 'pt'];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function mergeRuntimeMessages(modules) {
  const common = modules.common || {};
  const pages = modules.pages || {};
  const forms = modules.forms || {};
  const system = modules.system || {};

  return {
    common,
    ...common,
    assessment: modules.assessment || {},
    calculator: modules.calculator || {},
    compare: modules.compare || {},
    estimator: modules.estimator || {},
    products: modules.products || {},
    corporate: modules.corporate || {},
    ...pages,
    ...forms,
    ...system,
    legal: modules.legal || {},
    cookies: modules.cookies || {},
    impact: modules.impact || {},
    ecosystem: modules.ecosystem || {},
    platforms: modules.platforms || {},
  };
}

function loadLocale(locale) {
  const localeDir = path.join(TRANSLATIONS_DIR, locale);
  const modules = {};

  for (const entry of fs.readdirSync(localeDir).sort()) {
    if (!entry.endsWith('.json')) continue;
    modules[path.basename(entry, '.json')] = readJson(path.join(localeDir, entry));
  }

  return mergeRuntimeMessages(modules);
}

function extractKeys(obj, prefix = '') {
  const keys = new Set();

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      for (const childKey of extractKeys(value, fullKey)) {
        keys.add(childKey);
      }
    } else {
      keys.add(fullKey);
    }
  }

  return keys;
}

function walkFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (['node_modules', 'dist', '.next', 'coverage', '__tests__', 'e2e'].includes(entry.name))
        continue;
      walkFiles(fullPath, files);
      continue;
    }

    if (/\.(test|spec)\.(ts|tsx|js|jsx)$/.test(entry.name)) continue;

    if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

function isStaticTranslationKey(key) {
  return (
    key.length > 0 &&
    !key.includes('${') &&
    !/[{}\n/@]/.test(key) &&
    !key.includes(' ') &&
    key !== ':'
  );
}

const translations = {};
const availableKeys = new Set();

console.log('Loading modular translation files...\n');

for (const locale of LOCALES) {
  translations[locale] = loadLocale(locale);
  for (const key of extractKeys(translations[locale])) {
    availableKeys.add(key);
  }
  console.log(`Loaded ${locale}`);
}

const files = SCAN_DIRS.flatMap(dir => walkFiles(dir));
console.log(`\nScanning ${files.length} source file(s) for translation usage...\n`);

const translationPatterns = [
  /(?<![A-Za-z0-9_$])t\(['"`]([^'"`]+)['"`]\)/g,
  /(?<![A-Za-z0-9_$])t\(['"`]([^'"`]+)['"`],/g,
  /useTranslations\(['"`]([^'"`]+)['"`]\)/g,
  /getTranslations\(['"`]([^'"`]+)['"`]\)/g,
  /\$t\(['"`]([^'"`]+)['"`]\)/g,
];

const usedKeys = new Set();
const keyUsage = {};

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');

  for (const pattern of translationPatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const key = match[1];
      if (!isStaticTranslationKey(key)) continue;

      usedKeys.add(key);

      if (!keyUsage[key]) {
        keyUsage[key] = [];
      }
      keyUsage[key].push(path.relative(ROOT, file));
    }
  }
}

const missingKeys = [];

for (const key of usedKeys) {
  if (availableKeys.has(key)) continue;

  const possibleNamespaceMatches = Array.from(availableKeys).filter(
    availableKey => availableKey.endsWith(`.${key}`) || availableKey.startsWith(`${key}.`)
  );

  if (possibleNamespaceMatches.length === 0) {
    missingKeys.push(key);
  }
}

console.log(`Translation keys used in code: ${usedKeys.size}`);
console.log(`Available runtime translation keys: ${availableKeys.size}\n`);

if (missingKeys.length > 0) {
  console.log(`Missing keys: ${missingKeys.length}`);
  for (const key of missingKeys.slice(0, 25)) {
    console.log(`  - ${key}`);
    if (keyUsage[key]?.[0]) {
      console.log(`    used in: ${keyUsage[key][0]}`);
    }
  }
  if (missingKeys.length > 25) {
    console.log(`  ... and ${missingKeys.length - 25} more`);
  }
} else {
  console.log('No missing keys found');
}

process.exit(missingKeys.length > 0 ? 1 : 0);
