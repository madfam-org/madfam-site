#!/usr/bin/env node

/**
 * Translation validation script.
 *
 * The repo uses modular translation directories:
 * packages/i18n/src/translations/{en,es,pt}/*.json
 */

const fs = require('fs');
const path = require('path');

const TRANSLATIONS_DIR = path.join(__dirname, '../packages/i18n/src/translations');
const LOCALES = ['es', 'en', 'pt'];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function loadLocale(locale) {
  const localeDir = path.join(TRANSLATIONS_DIR, locale);
  const modules = {};

  for (const entry of fs.readdirSync(localeDir).sort()) {
    if (!entry.endsWith('.json')) continue;
    const moduleName = path.basename(entry, '.json');
    modules[moduleName] = readJson(path.join(localeDir, entry));
  }

  return modules;
}

function extractKeys(obj, prefix = '') {
  const keys = [];

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys.push(...extractKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }

  return keys;
}

const translations = {};
const allKeys = new Set();

console.log('Loading modular translation files...\n');

for (const locale of LOCALES) {
  try {
    translations[locale] = loadLocale(locale);
    const moduleCount = Object.keys(translations[locale]).length;
    console.log(`Loaded ${locale}: ${moduleCount} module(s)`);
  } catch (error) {
    console.error(`Error loading ${locale} translations:`, error.message);
    process.exit(1);
  }
}

for (const locale of LOCALES) {
  for (const key of extractKeys(translations[locale])) {
    allKeys.add(key);
  }
}

let hasErrors = false;
const missingKeys = {};

for (const locale of LOCALES) {
  missingKeys[locale] = [];
  const localeKeys = new Set(extractKeys(translations[locale]));

  for (const key of allKeys) {
    if (!localeKeys.has(key)) {
      missingKeys[locale].push(key);
      hasErrors = true;
    }
  }
}

console.log(`\nTotal unique module keys: ${allKeys.size}\n`);
console.log('Validation results:\n');

for (const locale of LOCALES) {
  const missing = missingKeys[locale];
  const coverage = (((allKeys.size - missing.length) / allKeys.size) * 100).toFixed(1);

  if (missing.length === 0) {
    console.log(`${locale}: complete (${allKeys.size} keys, 100% coverage)`);
  } else {
    console.log(`${locale}: missing ${missing.length} key(s), ${coverage}% coverage`);

    if (process.env.VERBOSE === 'true') {
      for (const key of missing.slice(0, 25)) {
        console.log(`  - ${key}`);
      }
      if (missing.length > 25) {
        console.log(`  ... and ${missing.length - 25} more`);
      }
    }
  }
}

console.log(`\nValidation: ${hasErrors ? 'failed' : 'passed'}`);

if (hasErrors) {
  console.log('Run with VERBOSE=true to see missing keys.');
}

process.exit(hasErrors ? 1 : 0);
