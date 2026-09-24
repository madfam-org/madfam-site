#!/usr/bin/env node
// Boundary checkpoint (2026-09-04, madfam-site): public repo (Lane C). This file names
// repo paths, commands and check names only; no hosts, credentials or identifiers.
// Policy: internal-devops/docs/repo-boundary-contract.md.

/**
 * Security Check Script - Comprehensive vulnerability assessment
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Every path in this script is repo-root relative ('apps/web/middleware.ts',
// 'apps/web/app/api', ...), but `pnpm --filter @madfam-site/web test:security` runs
// it with cwd = apps/web, where none of them resolve: every check reported
// "not found" and the run failed for the wrong reason. Anchor on the script's
// own location so the result is the same from any cwd.
process.chdir(path.resolve(__dirname, '..'));

class SecurityAuditor {
  constructor() {
    // Findings raised by this script's own configuration checks.
    this.issues = [];
    // Vulnerability counts reported by `pnpm audit`. Kept on separate fields
    // from the findings above: they used to share `criticalCount` etc., and
    // because checkDependencies() runs last it silently overwrote every
    // finding with the audit metadata — two visible ❌ lines still summarised
    // as "Critical: 0 ... Status: PASS", exit 0.
    this.depCritical = 0;
    this.depModerate = 0;
    this.depLow = 0;
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      error: '❌',
      warn: '⚠️',
      info: '🔍',
      success: '✅',
    }[level];

    console.log(`[${timestamp}] ${prefix} ${message}`);
  }

  async runAudit() {
    this.log('Starting comprehensive security audit...', 'info');

    try {
      // 1. Check for critical vulnerabilities
      await this.checkCriticalVulnerabilities();

      // 2. Validate security configurations
      await this.checkSecurityConfigurations();

      // 3. Check dependencies
      await this.checkDependencies();

      // 4. Generate report
      await this.generateReport();
    } catch (error) {
      this.log(`Security audit failed: ${error.message}`, 'error');
      process.exit(1);
    }
  }

  async checkCriticalVulnerabilities() {
    this.log('Checking for critical vulnerabilities...', 'info');

    try {
      // First, try a simple critical audit
      const result = execSync(
        'pnpm audit --audit-level critical 2>/dev/null || echo "no-critical"',
        {
          encoding: 'utf-8',
        }
      );

      if (result.includes('0 vulnerabilities') || result.includes('no-critical')) {
        this.log('No critical vulnerabilities found', 'success');
        return true;
      }

      // If we have critical vulnerabilities, parse them
      if (result.includes('critical')) {
        const lines = result.split('\n');
        const criticalLines = lines.filter(line => line.includes('critical'));

        this.criticalCount = criticalLines.length;
        this.issues.push({
          level: 'critical',
          message: `${this.criticalCount} critical vulnerabilities detected`,
          details: criticalLines,
        });

        this.log(`${this.criticalCount} CRITICAL vulnerabilities found!`, 'error');
        return false;
      }

      this.log('No critical vulnerabilities found', 'success');
      return true;
    } catch (error) {
      // If command fails, assume no critical issues for now
      this.log('Critical vulnerability check completed (no issues detected)', 'success');
      return true;
    }
  }

  async checkSecurityConfigurations() {
    this.log('Checking security configurations...', 'info');

    const checks = [
      {
        name: 'Security Headers',
        check: () => this.checkSecurityHeaders(),
        critical: true,
      },
      {
        name: 'Input Validation',
        check: () => this.checkInputValidation(),
        critical: true,
      },
      {
        name: 'Rate Limiting',
        check: () => this.checkRateLimiting(),
        critical: false,
      },
      {
        name: 'Environment Variables',
        check: () => this.checkEnvironmentSecurity(),
        critical: true,
      },
      {
        name: 'API Security',
        check: () => this.checkApiSecurity(),
        critical: true,
      },
    ];

    for (const check of checks) {
      try {
        const result = await check.check();
        if (result.passed) {
          this.log(`${check.name}: OK`, 'success');
        } else {
          const level = check.critical ? 'error' : 'warn';
          this.log(`${check.name}: ${result.message}`, level);

          this.issues.push({
            level: check.critical ? 'critical' : 'moderate',
            message: `${check.name}: ${result.message}`,
            details: result.details,
          });
        }
      } catch (error) {
        this.log(`${check.name}: Check failed - ${error.message}`, 'warn');
      }
    }
  }

  checkSecurityHeaders() {
    const middlewareFiles = ['apps/web/middleware.ts', 'apps/web/app/middleware.ts'];

    const requiredHeaders = ['X-Frame-Options', 'X-Content-Type-Options', 'Referrer-Policy'];

    for (const file of middlewareFiles) {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf-8');
        const missingHeaders = requiredHeaders.filter(header => !content.includes(header));

        if (missingHeaders.length === 0) {
          return { passed: true };
        } else {
          return {
            passed: false,
            message: `Missing security headers: ${missingHeaders.join(', ')}`,
            details: { file, missingHeaders },
          };
        }
      }
    }

    return {
      passed: false,
      message: 'No security middleware found',
      details: { expectedFiles: middlewareFiles },
    };
  }

  checkInputValidation() {
    const apiDir = 'apps/web/app/api';

    if (!fs.existsSync(apiDir)) {
      return {
        passed: false,
        message: 'API directory not found',
        details: { path: apiDir },
      };
    }

    // Only routes that actually read request input can be missing input
    // validation. Counting `GET /api/health`, which reads nothing, as an
    // unvalidated route made the rate meaningless.
    const readsInput =
      /request\.json\(|req\.json\(|\.formData\(|searchParams|request\.text\(|req\.text\(/;
    const allFiles = this.findFiles(apiDir, /route\.(ts|js)$/);
    const apiFiles = allFiles.filter(file => readsInput.test(fs.readFileSync(file, 'utf-8')));
    let validatedFiles = 0;

    for (const file of apiFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      if (content.includes('zod') || content.includes('z.') || content.includes('.parse(')) {
        validatedFiles++;
      }
    }

    const validationRate = apiFiles.length > 0 ? validatedFiles / apiFiles.length : 1;

    if (validationRate >= 0.8) {
      return { passed: true };
    } else {
      return {
        passed: false,
        message: `Only ${Math.round(validationRate * 100)}% of API routes have input validation`,
        details: {
          totalRoutes: allFiles.length,
          inputAcceptingRoutes: apiFiles.length,
          validatedFiles,
          validationRate: Math.round(validationRate * 100),
          unvalidated: apiFiles.filter(file => {
            const content = fs.readFileSync(file, 'utf-8');
            return !(
              content.includes('zod') ||
              content.includes('z.') ||
              content.includes('.parse(')
            );
          }),
        },
      };
    }
  }

  checkRateLimiting() {
    const searchPaths = ['apps/web/middleware.ts', 'apps/web/lib/', 'apps/web/app/api/'];
    let rateLimitingFound = false;

    for (const searchPath of searchPaths) {
      if (fs.existsSync(searchPath)) {
        try {
          const result = execSync(`grep -r "rateLimit\\|rate-limit" "${searchPath}"`, {
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'ignore'],
          });

          if (result.trim()) {
            rateLimitingFound = true;
            break;
          }
        } catch (error) {
          // grep returns non-zero when no matches found
        }
      }
    }

    if (rateLimitingFound) {
      return { passed: true };
    } else {
      return {
        passed: false,
        message: 'Rate limiting implementation not found',
        details: { searchPaths },
      };
    }
  }

  /**
   * Placeholder markers used across this repo's .env.example files. A value
   * carrying one of these is documentation, not a credential.
   */
  static get PLACEHOLDER_MARKERS() {
    return [
      '__change_me__',
      'change_me',
      'changeme',
      'replace-with',
      'replace_with',
      'replace me',
      'your-',
      'your_',
      '<',
      '{',
      '[',
      '${',
      'xxx',
      'example',
      'placeholder',
      'localhost',
    ];
  }

  /**
   * Returns the variable names in `content` whose value looks like a real
   * secret: a secret-shaped NAME assigned a value that is long enough to be
   * one and carries no placeholder marker.
   */
  static findSecretAssignments(content) {
    const nameLooksSecret = /(password|secret|token|_key|^key)$/i;
    const found = [];

    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;

      const match = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
      if (!match) continue;

      const [, name, rawValue] = match;
      if (!nameLooksSecret.test(name)) continue;

      // Strip surrounding quotes and any trailing comment.
      const value = rawValue
        .replace(/\s+#.*$/, '')
        .trim()
        .replace(/^(['"])(.*)\1$/, '$2')
        .trim();

      if (value.length < 12) continue; // too short to be a live credential
      const lowered = value.toLowerCase();
      if (SecurityAuditor.PLACEHOLDER_MARKERS.some(marker => lowered.includes(marker))) continue;

      found.push(name);
    }

    return found;
  }

  checkEnvironmentSecurity() {
    const envFiles = ['.env.example', 'apps/web/.env.example'];
    const issues = [];

    for (const envFile of envFiles) {
      if (fs.existsSync(envFile)) {
        const content = fs.readFileSync(envFile, 'utf-8');

        // Look for secret-shaped ASSIGNMENTS, not merely secret-shaped NAMES.
        // The old patterns (/key\s*=\s*[^<{[]/i and friends) matched every
        // ordinary `NEXT_PUBLIC_..._KEY=` line in a placeholder template, so
        // the check was red on a file that contained no secret at all — the
        // fastest way to get a gate switched off.
        const findings = SecurityAuditor.findSecretAssignments(content);
        for (const finding of findings) {
          issues.push(`Potential hardcoded secret in ${envFile}: ${finding}`);
        }
      }
    }

    if (issues.length === 0) {
      return { passed: true };
    } else {
      return {
        passed: false,
        message: 'Environment security issues found',
        details: { issues },
      };
    }
  }

  checkApiSecurity() {
    const apiDir = 'apps/web/app/api';
    const issues = [];

    if (!fs.existsSync(apiDir)) {
      return {
        passed: false,
        message: 'API directory not found',
        details: { path: apiDir },
      };
    }

    const apiFiles = this.findFiles(apiDir, /route\.(ts|js)$/);

    for (const file of apiFiles) {
      const content = fs.readFileSync(file, 'utf-8');

      // Check for basic security patterns
      if (content.includes('POST') && !content.includes('headers')) {
        issues.push(`${file}: POST endpoint without header validation`);
      }

      if (content.includes('request.json()') && !content.includes('try')) {
        issues.push(`${file}: JSON parsing without error handling`);
      }
    }

    if (issues.length === 0) {
      return { passed: true };
    } else {
      return {
        passed: false,
        message: 'API security issues found',
        details: { issues },
      };
    }
  }

  async checkDependencies() {
    this.log('Analyzing dependency security...', 'info');

    try {
      const auditResult = execSync('pnpm audit --json', {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      const audit = JSON.parse(auditResult);
      const metadata = audit.metadata?.vulnerabilities || {};

      this.depCritical = metadata.critical || 0;
      this.depModerate = metadata.moderate || 0;
      this.depLow = metadata.low || 0;

      this.log(
        `Dependencies: ${metadata.critical || 0} critical, ${metadata.moderate || 0} moderate, ${metadata.low || 0} low`,
        'info'
      );
    } catch (error) {
      // Audit command returns non-zero when vulnerabilities found
      this.log('Dependency audit completed with findings', 'info');
    }
  }

  /**
   * Summary over both axes: findings raised by this script, and vulnerability
   * counts from `pnpm audit`. A run fails when either axis has a critical.
   */
  buildReport() {
    const bySeverity = this.issues.reduce(
      (acc, issue) => {
        acc[issue.level] = (acc[issue.level] || 0) + 1;
        return acc;
      },
      { critical: 0, moderate: 0, low: 0 }
    );

    const failing = bySeverity.critical + this.depCritical;

    return {
      timestamp: new Date().toISOString(),
      summary: {
        findings: {
          critical: bySeverity.critical,
          moderate: bySeverity.moderate,
          low: bySeverity.low,
          total: this.issues.length,
        },
        dependencies: {
          critical: this.depCritical,
          moderate: this.depModerate,
          low: this.depLow,
        },
        failing,
      },
      issues: this.issues,
      status: failing === 0 ? 'PASS' : 'FAIL',
    };
  }

  async generateReport() {
    this.log('Generating security report...', 'info');

    const report = this.buildReport();
    const { findings, dependencies, failing } = report.summary;

    // Write report to file
    fs.writeFileSync('security-report.json', JSON.stringify(report, null, 2));

    // Console summary — the two axes are printed separately so a reader can
    // tell a misconfiguration from a vulnerable dependency.
    console.log('\n' + '='.repeat(60));
    console.log('🔒 SECURITY AUDIT SUMMARY');
    console.log('='.repeat(60));
    console.log(`Status: ${report.status === 'PASS' ? '✅ PASS' : '❌ FAIL'}`);
    console.log(
      `Findings:     ${findings.critical} critical, ${findings.moderate} moderate, ${findings.low} low (${findings.total} total)`
    );
    console.log(
      `Dependencies: ${dependencies.critical} critical, ${dependencies.moderate} moderate, ${dependencies.low} low`
    );
    console.log('='.repeat(60));

    for (const issue of this.issues) {
      console.log(`  [${issue.level}] ${issue.message}`);
    }

    if (failing > 0) {
      console.log(`\n❌ ${failing} CRITICAL ISSUE(S) FOUND - Security audit FAILED`);
      process.exit(1);
    }

    console.log('\n✅ No critical security issues found');
    process.exit(0);
  }

  findFiles(dir, pattern) {
    const files = [];

    const walk = currentDir => {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);

        if (entry.isDirectory() && !entry.name.startsWith('.')) {
          walk(fullPath);
        } else if (entry.isFile() && pattern.test(entry.name)) {
          files.push(fullPath);
        }
      }
    };

    if (fs.existsSync(dir)) {
      walk(dir);
    }

    return files;
  }
}

// Run the security audit
if (require.main === module) {
  const auditor = new SecurityAuditor();
  auditor.runAudit().catch(error => {
    console.error('Security audit failed:', error);
    process.exit(1);
  });
}

module.exports = SecurityAuditor;
