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
    this.depHigh = 0;
    this.depModerate = 0;
    this.depLow = 0;
    // Lowest dependency severity that fails the run. `critical` by default;
    // SECURITY_FAIL_ON=high tightens it once the high backlog is cleared.
    this.failOn = SecurityAuditor.normalizeFailOn(process.env.SECURITY_FAIL_ON);
  }

  static normalizeFailOn(value) {
    return value === 'high' ? 'high' : 'critical';
  }

  /**
   * Parses `pnpm audit --json` output into severity counts. Throws when the
   * output is not an audit report, so a broken audit can never read as clean.
   */
  static parseAuditOutput(output) {
    if (typeof output !== 'string' || output.trim() === '') {
      throw new Error('pnpm audit produced no output');
    }
    let audit;
    try {
      audit = JSON.parse(output);
    } catch {
      throw new Error('pnpm audit output is not JSON');
    }
    const vulns = audit && audit.metadata && audit.metadata.vulnerabilities;
    if (!vulns || typeof vulns !== 'object') {
      throw new Error('pnpm audit JSON has no metadata.vulnerabilities');
    }
    const count = key => (Number.isFinite(vulns[key]) ? vulns[key] : 0);
    return {
      critical: count('critical'),
      high: count('high'),
      moderate: count('moderate'),
      low: count('low'),
    };
  }

  /**
   * Runs `pnpm audit --json`. pnpm exits non-zero whenever it finds anything,
   * so the report is read from `error.stdout` in that case: the old handler
   * swallowed the error and left every count at 0 (finding S1-005).
   */
  static runPnpmAudit(exec = execSync) {
    let output;
    try {
      output = exec('pnpm audit --json', {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
        maxBuffer: 64 * 1024 * 1024,
      });
    } catch (error) {
      output = error && error.stdout ? String(error.stdout) : '';
      if (!output) {
        const reason = error && error.message ? error.message : String(error);
        throw new Error(`pnpm audit failed without a report: ${reason}`);
      }
    }
    return SecurityAuditor.parseAuditOutput(output);
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
      // 1. Validate security configurations
      await this.checkSecurityConfigurations();

      // 2. Check dependencies (pnpm audit; fails closed)
      await this.checkDependencies();

      // 3. Generate report
      await this.generateReport();
    } catch (error) {
      this.log(`Security audit failed: ${error.message}`, 'error');
      process.exit(1);
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
        // Fail closed: a check that cannot run proves nothing. It used to be
        // logged as a warning and the run still passed.
        this.log(`${check.name}: Check failed - ${error.message}`, 'error');
        this.issues.push({
          level: check.critical ? 'critical' : 'moderate',
          message: `${check.name}: check could not run (${error.message})`,
          details: {},
        });
      }
    }
  }

  /**
   * Security headers are declared in two places (finding S1-017): the static
   * set in `headers()` of apps/web/next.config.js (every path), and the
   * per-request nonce CSP in apps/web/middleware.ts. A header counts only when
   * it is actually declared — a `key: '<Name>'` entry in next.config.js or a
   * `headers.set('<Name>', …)` call in middleware.ts — not when its name merely
   * appears in a comment.
   */
  checkSecurityHeaders() {
    const sources = {
      nextConfig: 'apps/web/next.config.js',
      middleware: 'apps/web/middleware.ts',
    };
    const missingFiles = Object.values(sources).filter(file => !fs.existsSync(file));
    if (missingFiles.length > 0) {
      return {
        passed: false,
        message: `Security header sources not found: ${missingFiles.join(', ')}`,
        details: { expectedFiles: Object.values(sources) },
      };
    }

    const missingHeaders = SecurityAuditor.missingSecurityHeaders({
      nextConfig: fs.readFileSync(sources.nextConfig, 'utf-8'),
      middleware: fs.readFileSync(sources.middleware, 'utf-8'),
    });

    if (missingHeaders.length === 0) {
      return { passed: true };
    }
    return {
      passed: false,
      message: `Missing security headers: ${missingHeaders.join(', ')}`,
      details: { sources, missingHeaders },
    };
  }

  /**
   * A getter, not a property assigned after the class: the CLI entry point
   * starts the audit before the end of this module has run.
   */
  static get REQUIRED_SECURITY_HEADERS() {
    return [
      'Content-Security-Policy',
      'X-Frame-Options',
      'X-Content-Type-Options',
      'Referrer-Policy',
      'Strict-Transport-Security',
    ];
  }

  static missingSecurityHeaders({ nextConfig = '', middleware = '' }) {
    const stripComments = text =>
      text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    const declared = new Set();
    const collect = (text, pattern) => {
      for (const match of stripComments(text).matchAll(pattern)) {
        declared.add(match[1].toLowerCase());
      }
    };
    collect(nextConfig, /\bkey:\s*['"]([\w-]+)['"]/g);
    collect(middleware, /headers\.set\(\s*['"]([\w-]+)['"]/g);
    collect(nextConfig, /headers\.set\(\s*['"]([\w-]+)['"]/g);
    collect(middleware, /\bkey:\s*['"]([\w-]+)['"]/g);

    return SecurityAuditor.REQUIRED_SECURITY_HEADERS.filter(
      header => !declared.has(header.toLowerCase())
    );
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

  async checkDependencies(exec = execSync) {
    this.log('Analyzing dependency security...', 'info');

    let counts;
    try {
      counts = SecurityAuditor.runPnpmAudit(exec);
    } catch (error) {
      // Fail closed: an audit that cannot run is not a clean audit.
      this.issues.push({
        level: 'critical',
        message: `Dependency audit could not run: ${error.message}`,
        details: {},
      });
      this.log(`Dependency audit could not run: ${error.message}`, 'error');
      return;
    }

    this.depCritical = counts.critical;
    this.depHigh = counts.high;
    this.depModerate = counts.moderate;
    this.depLow = counts.low;

    const level = counts.critical > 0 ? 'error' : counts.high > 0 ? 'warn' : 'info';
    this.log(
      `Dependencies: ${counts.critical} critical, ${counts.high} high, ${counts.moderate} moderate, ${counts.low} low`,
      level
    );
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

    const failing =
      bySeverity.critical + this.depCritical + (this.failOn === 'high' ? this.depHigh : 0);

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
          high: this.depHigh,
          moderate: this.depModerate,
          low: this.depLow,
        },
        failOn: this.failOn,
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
      `Dependencies: ${dependencies.critical} critical, ${dependencies.high} high, ${dependencies.moderate} moderate, ${dependencies.low} low (fails on: ${report.summary.failOn})`
    );
    console.log('='.repeat(60));

    for (const issue of this.issues) {
      console.log(`  [${issue.level}] ${issue.message}`);
    }

    if (failing > 0) {
      console.log(`\n❌ ${failing} FAILING ISSUE(S) FOUND - Security audit FAILED`);
      process.exit(1);
    }

    if (dependencies.high > 0) {
      console.log(
        `\n⚠️ ${dependencies.high} high-severity dependency advisories (reported, not failing; set SECURITY_FAIL_ON=high to enforce)`
      );
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
