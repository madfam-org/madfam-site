#!/usr/bin/env node
/**
 * Fix Next.js 15 params breaking change
 * In Next.js 15, params must be awaited as they are now Promises
 */

const fs = require('fs');
const path = require('path');

const filesToFix = [
  './app/[locale]/demo/forge-sight/page.tsx',
  './app/[locale]/demo/dhanam/page.tsx',
  './app/[locale]/contact/page.tsx',
  './app/[locale]/products/page.tsx',
  './app/[locale]/calculator/page.tsx',
  './app/[locale]/privacy/page.tsx',
  './app/[locale]/auth/signin/page.tsx',
  './app/[locale]/estimator/page.tsx',
  './app/[locale]/terms/page.tsx',
  './app/[locale]/solutions/colabs/page.tsx',
  './app/[locale]/solutions/page.tsx',
  './app/[locale]/assessment/page.tsx',
  './app/[locale]/docs/page.tsx',
  './app/[locale]/blog/page.tsx',
  './app/[locale]/blog/[slug]/page.tsx',
  './app/[locale]/case-studies/page.tsx',
  './app/[locale]/careers/page.tsx',
  './app/[locale]/dashboard/page.tsx',
  './app/[locale]/programs/page.tsx',
  './app/[locale]/guides/page.tsx',
  './app/[locale]/api/page.tsx',
  './app/[locale]/showcase/page.tsx',
  './app/[locale]/page.tsx',
  './app/[locale]/impact/page.tsx',
  './app/[locale]/cookies/page.tsx',
];

let fixedCount = 0;
let skippedCount = 0;

filesToFix.forEach(filePath => {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    let content = fs.readFileSync(fullPath, 'utf8');
    const original = content;

    // Pattern 1: Single locale param
    // From: { params: { locale } }: { params: { locale: string } }
    // To: { params }: { params: Promise<{ locale: string }> }
    content = content.replace(
      /\(\{\s*params:\s*\{\s*locale\s*\}\s*\}:\s*\{\s*params:\s*\{\s*locale:\s*string\s*\}\s*\}\)/g,
      '({ params }: { params: Promise<{ locale: string }> })'
    );

    // Pattern 2: locale + slug params
    // From: { params: { locale, slug } }: { params: { locale: string; slug: string } }
    // To: { params }: { params: Promise<{ locale: string; slug: string }> }
    content = content.replace(
      /\(\{\s*params:\s*\{\s*locale,\s*slug\s*\}\s*\}:\s*\{\s*params:\s*\{\s*locale:\s*string;\s*slug:\s*string\s*\}\s*\}\)/g,
      '({ params }: { params: Promise<{ locale: string; slug: string }> })'
    );

    // If content changed, we need to add await for params destructuring
    if (content !== original) {
      // Find the function body start and insert the await destructuring
      // Look for the pattern: }) {
      content = content.replace(/(\)\s*\{\s*\n)/, match => {
        // Check if we already have the await params line
        const nextLines = content.split(match)[1].substring(0, 100);
        if (nextLines.includes('const { locale } = await params')) {
          return match; // Already fixed
        }
        return match + '  const { locale } = await params;\n';
      });

      // For files with both locale and slug
      content = content.replace(/const \{ locale \} = await params;\n/g, (match, offset) => {
        // Check if this file needs slug too
        if (original.includes('locale, slug')) {
          return '  const { locale, slug } = await params;\n';
        }
        return match;
      });

      fs.writeFileSync(fullPath, content);
      console.log(`✅ Fixed: ${filePath}`);
      fixedCount++;
    } else {
      console.log(`⏭️  Skipped (already fixed or no match): ${filePath}`);
      skippedCount++;
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
});

console.log(`\nSummary: ${fixedCount} fixed, ${skippedCount} skipped`);
