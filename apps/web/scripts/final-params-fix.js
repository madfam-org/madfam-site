#!/usr/bin/env node

const fs = require('fs');

const filesToFix = [
  'app/[locale]/solutions/colabs/page.tsx',
  'app/[locale]/solutions/page.tsx',
  'app/[locale]/programs/page.tsx',
];

filesToFix.forEach(file => {
  console.log(`\nFixing: ${file}`);
  let content = fs.readFileSync(file, 'utf-8');
  let modified = false;

  // Fix 1: Add await params in generateMetadata if missing
  if (
    content.match(
      /export async function generateMetadata\(\{ params \}: Props\): Promise<Metadata> \{\s*const t = await getTranslations/
    )
  ) {
    content = content.replace(
      /(export async function generateMetadata\(\{ params \}: Props\): Promise<Metadata> \{\s*)(const t = await getTranslations)/,
      '$1const { locale } = await params;\n  $2'
    );
    console.log('  ✓ Added await params in generateMetadata');
    modified = true;
  }

  // Fix 2: Remove duplicate locale declarations
  const localeMatches = content.match(/const \{ locale \} = await params;/g);
  if (localeMatches && localeMatches.length > 1) {
    // Keep only the first occurrence
    let firstFound = false;
    content = content.replace(/const \{ locale \} = await params;/g, match => {
      if (!firstFound) {
        firstFound = true;
        return match;
      }
      return ''; // Remove duplicates
    });
    console.log(`  ✓ Removed ${localeMatches.length - 1} duplicate locale declaration(s)`);
    modified = true;
  }

  // Fix 3: Fix standalone "locale: locale," to just "locale,"
  if (content.match(/locale: locale,/)) {
    content = content.replace(/locale: locale,/g, 'locale,');
    console.log('  ✓ Fixed "locale: locale" to "locale"');
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(file, content, 'utf-8');
    console.log(`  ✅ Saved ${file}`);
  } else {
    console.log(`  ⚠️  No changes needed`);
  }
});

console.log('\n✅ All fixes applied!');
