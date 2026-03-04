#!/usr/bin/env node
/**
 * Comprehensive fix for Next.js 15 async params across all pages
 * Handles multiple patterns:
 * - Direct params destructuring
 * - generateMetadata functions
 * - Custom prop interfaces
 */

const fs = require('fs');
const path = require('path');

const filesToFix = [
  './app/[locale]/calculator/page.tsx',
  './app/[locale]/terms/page.tsx',
  './app/[locale]/solutions/page.tsx',
  './app/[locale]/solutions/colabs/page.tsx',
  './app/[locale]/showcase/page.tsx',
  './app/[locale]/programs/page.tsx',
  './app/[locale]/products/page.tsx',
  './app/[locale]/privacy/page.tsx',
  './app/[locale]/guides/page.tsx',
  './app/[locale]/estimator/page.tsx',
  './app/[locale]/docs/page.tsx',
  './app/[locale]/dashboard/page.tsx',
  './app/[locale]/cookies/page.tsx',
  './app/[locale]/contact/page.tsx',
  './app/[locale]/case-studies/page.tsx',
  './app/[locale]/careers/page.tsx',
  './app/[locale]/auth/signin/page.tsx',
];

let fixedCount = 0;
let errors = [];

filesToFix.forEach(filePath => {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    if (!fs.existsSync(fullPath)) {
      console.log(`⏭️  Skipped (not found): ${filePath}`);
      return;
    }

    let content = fs.readFileSync(fullPath, 'utf8');
    const original = content;
    let modified = false;

    // Pattern 1: Fix inline params destructuring in function signature
    // From: { params: { locale } }: { params: { locale: string } }
    // To: { params }: { params: Promise<{ locale: string }> }
    if (
      content.match(
        /\{\s*params:\s*\{\s*locale[^}]*\}\s*\}:\s*\{\s*params:\s*\{\s*locale:\s*string/
      )
    ) {
      content = content.replace(
        /\{\s*params:\s*\{\s*locale:\s*_locale\s*\}\s*\}:\s*\{\s*params:\s*\{\s*locale:\s*string\s*\}\s*\}/g,
        '{ params }: { params: Promise<{ locale: string }> }'
      );
      content = content.replace(
        /\{\s*params:\s*\{\s*locale\s*\}\s*\}:\s*\{\s*params:\s*\{\s*locale:\s*string\s*\}\s*\}/g,
        '{ params }: { params: Promise<{ locale: string }> }'
      );
      modified = true;
    }

    // Pattern 2: Fix custom interface definitions
    // Look for interface definitions with params
    content = content.replace(
      /(interface\s+\w+\s*\{[^}]*params:\s*)\{\s*locale:\s*string;?\s*\}/g,
      '$1Promise<{ locale: string }>'
    );

    // Pattern 3: Add await destructuring if params was changed but no await exists
    if (modified || content !== original) {
      // Find function bodies and add await if needed
      const lines = content.split('\n');
      const newLines = [];
      let inFunction = false;
      let needsAwait = false;
      let bracketDepth = 0;
      let awaitAdded = false;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Detect function signature with Promise params
        if (line.includes('params }: { params: Promise<{ locale: string }>')) {
          needsAwait = true;
          inFunction = true;
          awaitAdded = false;
          newLines.push(line);
          continue;
        }

        // Track brackets to know when we're in function body
        if (inFunction) {
          const openBrackets = (line.match(/\{/g) || []).length;
          const closeBrackets = (line.match(/\}/g) || []).length;
          bracketDepth += openBrackets - closeBrackets;

          // If we're in the function body and haven't added await yet
          if (bracketDepth > 0 && needsAwait && !awaitAdded) {
            // Check if await is already there
            const nextFewLines = lines.slice(i, i + 3).join('\n');
            if (!nextFewLines.includes('await params')) {
              // Add the await destructuring
              newLines.push(line);
              newLines.push('  const { locale } = await params;');
              awaitAdded = true;
              needsAwait = false;
              continue;
            } else {
              awaitAdded = true;
              needsAwait = false;
            }
          }

          if (bracketDepth === 0) {
            inFunction = false;
          }
        }

        newLines.push(line);
      }

      content = newLines.join('\n');
    }

    // Only write if actually changed
    if (content !== original) {
      fs.writeFileSync(fullPath, content);
      console.log(`✅ Fixed: ${filePath}`);
      fixedCount++;
    } else {
      console.log(`⏭️  Skipped (no changes needed): ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    errors.push({ file: filePath, error: error.message });
  }
});

console.log(`\n✨ Summary: ${fixedCount} files fixed`);
if (errors.length > 0) {
  console.log(`\n❌ Errors encountered:`);
  errors.forEach(({ file, error }) => {
    console.log(`  ${file}: ${error}`);
  });
  process.exit(1);
}
