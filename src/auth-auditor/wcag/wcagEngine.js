import { chromium } from 'playwright';
import { AuthRules } from './authRules.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * WCAG Engine - Handles accessibility scanning with auth-specific rules
 */
class WcagEngine {
  constructor() {
    this.browser = null;
    this.context = null;
    this.page = null;
    this.authRules = new AuthRules();
    this.axeCorePath = null; // Resolved once, used everywhere
  }

  async initialize() {
    const browserlessToken = process.env.BROWSERLESS_API_KEY;

    if (browserlessToken) {
      const cleanToken = browserlessToken.includes('token=') ? browserlessToken.split('token=')[1] : browserlessToken;
      const wsEndpoint = `wss://production-sfo.browserless.io/playwright?token=${cleanToken.trim()}`;
      console.log(`[WCAG-ENGINE] 🌐 Connecting to Browserless.io SFO: ${wsEndpoint.substring(0, 48)}...`);
      this.browser = await chromium.connect({ wsEndpoint });
    } else {
      console.log(`[WCAG-ENGINE] 💻 Launching local instance (Heads-up)...`);
      this.browser = await chromium.launch({ 
        headless: false, 
        args: [] 
      });
    }
    this.context = await this.browser.newContext({
      viewport: { width: 1280, height: 720 },
      bypassCSP: true
    });
    this.page = await this.context.newPage();
  }

  /**
   * Resolve the axe-core file path ONCE using multiple strategies.
   * Returns an absolute path string, or null if not found.
   */
  resolveAxeCorePath() {
    if (this.axeCorePath) return this.axeCorePath;

    console.log('[AXE-CORE] Resolving axe-core path...');
    console.log('[AXE-CORE] __dirname:', __dirname);
    console.log('[AXE-CORE] process.cwd():', process.cwd());

    // Strategy 1: Node's require.resolve (most robust)
    try {
      const resolved = require.resolve('axe-core/axe.min.js');
      if (fs.existsSync(resolved)) {
        console.log(`[AXE-CORE] ✅ Found via require.resolve: ${resolved}`);
        this.axeCorePath = resolved;
        return resolved;
      }
    } catch (e) {
      console.warn('[AXE-CORE] require.resolve failed:', e.message);
    }

    // Strategy 2: Walk up from __dirname to find node_modules
    const searchPaths = [
      path.join(__dirname, '../node_modules/axe-core/axe.min.js'),       // wcag/../node_modules
      path.join(__dirname, '../../node_modules/axe-core/axe.min.js'),    // auth-auditor/node_modules
      path.join(__dirname, '../../../node_modules/axe-core/axe.min.js'), // src/../node_modules (root)
      path.join(process.cwd(), 'node_modules/axe-core/axe.min.js'),     // cwd (e.g. server/)
      path.join(process.cwd(), '../node_modules/axe-core/axe.min.js'),  // cwd parent (root)
    ];

    for (const p of searchPaths) {
      const resolved = path.resolve(p);
      if (fs.existsSync(resolved)) {
        console.log(`[AXE-CORE] ✅ Found via fallback walk: ${resolved}`);
        this.axeCorePath = resolved;
        return resolved;
      }
    }

    console.error('[AXE-CORE] ❌ Could not find axe-core anywhere! Searched:');
    searchPaths.forEach(p => console.error(`  - ${path.resolve(p)}`));
    return null;
  }

  /**
   * Inject axe-core into a Playwright page using the resolved file path.
   * Uses addScriptTag({ path }) — same method as the working standard scan.
   */
  async injectAxeCore(page) {
    const axePath = this.resolveAxeCorePath();

    if (axePath) {
      // Use { path: } — Playwright reads the file and injects it.
      // This is the SAME method used by the working standard scan in server/index.js.
      await page.addScriptTag({ path: axePath });
      console.log('[AXE-CORE] ✅ Injected into page via addScriptTag({ path })');
    } else {
      // Emergency fallback: inject a stub so downstream code doesn't crash
      console.error('[AXE-CORE] ❌ Injecting empty stub — scans will return no results!');
      await page.addScriptTag({
        content: `window.axe = { run: async () => ({ violations: [], passes: [], incomplete: [] }) };`
      });
    }
  }

  /**
   * Run comprehensive WCAG audit on an existing live page
   * @param {import('playwright').Page} page
   * @param {string} url
   * @param {string} auditType
   */
  async runAuditOnPage(page, url, auditType = 'page') {
    try {
      console.log(`🔍 Running ${auditType} audit on live page: ${url}`);
      
      // Inject axe-core using the robust path-based method
      await this.injectAxeCore(page);
      
      // Wait for any animations to settle
      await page.waitForTimeout(500);

      // Run axe-core for general WCAG checks
      const axeResults = await page.evaluate(async () => {
        return await axe.run({
          reporter: 'v2',
          rules: {
            // Enable all rules
          }
        });
      });

      // Run authentication-specific rules if this is an auth page
      let authResults = [];
      if (auditType === 'auth') {
        authResults = await page.evaluate(() => {
          const violations = [];
          const getSelector = (el) => {
            if (el.id) return `#${el.id}`;
            if (el.name) return `[name="${el.name}"]`;
            return el.tagName.toLowerCase();
          };

          const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="password"]');
          inputs.forEach(input => {
            const hasLabel = document.querySelector(`label[for="${input.id}"]`) || 
                            input.closest('label') ||
                            input.getAttribute('aria-label') ||
                            input.getAttribute('aria-labelledby');
            
            if (!hasLabel) {
              violations.push({
                rule: 'auth-input-label',
                severity: 'high',
                element: input.outerHTML.substring(0, 100),
                message: 'Input field must have an associated label',
                selector: getSelector(input)
              });
            }
          });
          return violations;
        });
      }

      // Process and structure results
      console.log(`[WCAG-ENGINE] ====== SCAN RESULTS for ${url} ======`);
      console.log(`[WCAG-ENGINE] axe-core Violations: ${axeResults.violations?.length || 0}`);
      console.log(`[WCAG-ENGINE] axe-core Passes: ${axeResults.passes?.length || 0}`);
      console.log(`[WCAG-ENGINE] axe-core Incomplete: ${axeResults.incomplete?.length || 0}`);
      if (auditType === 'auth') {
        console.log(`[WCAG-ENGINE] Auth-specific violations: ${authResults.length}`);
      }
      console.log(`[WCAG-ENGINE] ================================`);

      const processedResults = this.processResults(axeResults, authResults, auditType);

      return {
        success: true,
        url: url,
        auditType: auditType,
        timestamp: new Date().toISOString(),
        results: processedResults
      };

    } catch (error) {
      console.error(`❌ Audit failed on page: ${error.message}`);
      return {
        success: false,
        error: error.message,
        url: url,
        auditType: auditType
      };
    }
  }

  /**
   * Original runAudit (kept for backward compatibility)
   */
  async runAudit(pageContent, url, auditType = 'page') {
    try {
      if (!this.page) await this.initialize();
      await this.page.setContent(pageContent, { waitUntil: 'load' });
      return await this.runAuditOnPage(this.page, url, auditType);
    } catch (error) {
      return {
        success: false,
        error: error.message,
        url: url,
        auditType: auditType
      };
    }
  }

  /**
   * Run authentication-specific WCAG rules
   */
  async runAuthRules() {
    return await this.page.evaluate(() => {
      // Helper function to get element selector
      function getElementSelector(element) {
        if (element.id) return `#${element.id}`;
        if (element.name) return `[name="${element.name}"]`;
        if (element.className) return `.${element.className.split(' ').join('.')}`;
        return element.tagName.toLowerCase();
      }

      const violations = [];

      // Rule: Input fields must have associated labels
      const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="password"]');
      inputs.forEach(input => {
        const hasLabel = document.querySelector(`label[for="${input.id}"]`) || 
                        input.closest('label') ||
                        input.getAttribute('aria-label') ||
                        input.getAttribute('aria-labelledby');
        
        if (!hasLabel) {
          violations.push({
            rule: 'auth-input-label',
            severity: 'high',
            element: input.outerHTML.substring(0, 100),
            message: 'Input field must have an associated label',
            selector: getElementSelector(input)
          });
        }
      });

      // Rule: Inputs must not rely only on placeholders
      inputs.forEach(input => {
        const hasLabel = document.querySelector(`label[for="${input.id}"]`) || 
                        input.closest('label') ||
                        input.getAttribute('aria-label');
        
        if (!hasLabel && input.placeholder) {
          violations.push({
            rule: 'auth-placeholder-only',
            severity: 'medium',
            element: input.outerHTML.substring(0, 100),
            message: 'Input field should not rely solely on placeholder text for identification',
            selector: getElementSelector(input)
          });
        }
      });

      // Rule: autocomplete attributes must be present
      const emailField = document.querySelector('input[type="email"], input[name*="email"]');
      if (emailField && !emailField.getAttribute('autocomplete')) {
        violations.push({
          rule: 'auth-autocomplete-email',
          severity: 'medium',
          element: emailField.outerHTML.substring(0, 100),
          message: 'Email field should have autocomplete="email" or autocomplete="username"',
          selector: getElementSelector(emailField)
        });
      }

      const passwordField = document.querySelector('input[type="password"]');
      if (passwordField && passwordField.getAttribute('autocomplete') !== 'current-password') {
        violations.push({
          rule: 'auth-autocomplete-password',
          severity: 'medium',
          element: passwordField.outerHTML.substring(0, 100),
          message: 'Password field should have autocomplete="current-password"',
          selector: getElementSelector(passwordField)
        });
      }

      // Rule: Required fields must be clearly indicated
      inputs.forEach(input => {
        if (input.required) {
          const hasAriaRequired = input.getAttribute('aria-required') === 'true';
          const hasRequiredIndicator = 
            input.closest('label')?.textContent.includes('*') ||
            input.parentElement?.querySelector('.required, .asterisk, [aria-label*="required"]');
          
          if (!hasAriaRequired && !hasRequiredIndicator) {
            violations.push({
              rule: 'auth-required-indication',
              severity: 'low',
              element: input.outerHTML.substring(0, 100),
              message: 'Required field should be clearly indicated',
              selector: getElementSelector(input)
            });
          }
        }
      });

      // Rule: Error messages must be visible and associated
      const errorElements = document.querySelectorAll('.error, .alert-error, [role="alert"], .login-error, .signin-error');
      errorElements.forEach(error => {
        if (error.textContent.trim()) {
          const isAssociated = error.getAttribute('aria-live') || 
                               error.getAttribute('role') === 'alert' ||
                               error.previousElementSibling?.tagName === 'INPUT' ||
                               error.nextElementSibling?.tagName === 'INPUT';
          
          if (!isAssociated) {
            violations.push({
              rule: 'auth-error-association',
              severity: 'high',
              element: error.outerHTML.substring(0, 100),
              message: 'Error message should be programmatically associated with the input field',
              selector: getElementSelector(error)
            });
          }
        }
      });

      // Rule: No color-only error indication
      const inputsWithError = document.querySelectorAll('input[aria-invalid="true"], .error input, .invalid input');
      inputsWithError.forEach(input => {
        const hasErrorText = 
          input.getAttribute('aria-describedby') ||
          input.nextElementSibling?.classList.contains('error') ||
          input.previousElementSibling?.classList.contains('error') ||
          input.closest('div')?.querySelector('.error-message');
        
        if (!hasErrorText) {
          violations.push({
            rule: 'auth-color-only-error',
            severity: 'medium',
            element: input.outerHTML.substring(0, 100),
            message: 'Error indication should not rely on color alone',
            selector: getElementSelector(input)
          });
        }
      });

      // Rule: Form must be navigable via keyboard
      const focusableElements = document.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      const hasTabIndex = Array.from(focusableElements).some(el => el.tabIndex >= 0);
      if (focusableElements.length > 0 && !hasTabIndex) {
        violations.push({
          rule: 'auth-keyboard-navigation',
          severity: 'high',
          element: '<form>',
          message: 'Form elements must be keyboard navigable',
          selector: 'form'
        });
      }

      // Rule: Submit button must be identifiable
      const submitButtons = document.querySelectorAll('button[type="submit"], input[type="submit"]');
      submitButtons.forEach(button => {
        const hasText = button.textContent.trim() || button.value || button.getAttribute('aria-label');
        if (!hasText) {
          violations.push({
            rule: 'auth-submit-button-label',
            severity: 'high',
            element: button.outerHTML.substring(0, 100),
            message: 'Submit button must have accessible text',
            selector: getElementSelector(button)
          });
        }
      });

      // Rule: Check for CAPTCHA accessibility
      const captchaElements = document.querySelectorAll('[src*="captcha"], [id*="captcha"], [class*="captcha"]');
      if (captchaElements.length > 0) {
        captchaElements.forEach(captcha => {
          const hasAlternative = captcha.nextElementSibling?.textContent.includes('audio') ||
                                captcha.nextElementSibling?.textContent.includes('alternative') ||
                                document.querySelector('a[href*="audio"], a[href*="alternative"]');
          
          if (!hasAlternative) {
            violations.push({
              rule: 'auth-captcha-alternative',
              severity: 'medium',
              element: captcha.outerHTML.substring(0, 100),
              message: 'CAPTCHA must provide accessible alternatives',
              selector: getElementSelector(captcha)
            });
          }
        });
      }

      return violations;
    });
  }

  /**
   * Process and structure WCAG results
   */
  processResults(axeResults, authResults, auditType) {
    const violations = [];
    const passes = [];

    // Process axe-core violations
    axeResults.violations.forEach(violation => {
      violation.nodes.forEach(node => {
        violations.push({
          type: auditType,
          rule: violation.id,
          severity: this.mapSeverity(violation.impact),
          element: node.html.substring(0, 200),
          message: violation.description,
          selector: node.target.join(' > '),
          help: violation.help,
          helpUrl: violation.helpUrl,
          tags: violation.tags || []
        });
      });
    });

    // Process axe-core passes
    axeResults.passes.forEach(pass => {
      pass.nodes.forEach(node => {
        passes.push({
          type: auditType,
          rule: pass.id,
          element: node.html.substring(0, 200),
          message: pass.description,
          selector: node.target.join(' > '),
          help: pass.help,
          tags: pass.tags || []
        });
      });
    });

    // Process auth-specific violations
    authResults.forEach(violation => {
      violations.push({
        type: 'auth',
        rule: violation.rule,
        severity: violation.severity,
        element: violation.element,
        message: violation.message,
        selector: violation.selector,
        help: this.getAuthRuleHelp(violation.rule),
        tags: ['wcag332', 'wcag131'] // Default tags for form accessibility
      });
    });

    return {
      violations,
      passes,
      score: this.calculateScore(violations),
      summary: {
        total: violations.length + passes.length,
        violations: violations.length,
        passes: passes.length,
        critical: violations.filter(v => v.severity === 'high').length,
        serious: violations.filter(v => v.severity === 'medium').length,
        moderate: violations.filter(v => v.severity === 'low').length
      }
    };
  }

  /**
   * Map axe impact to severity levels
   */
  mapSeverity(impact) {
    switch (impact) {
      case 'critical': return 'high';
      case 'serious': return 'medium';
      case 'moderate': return 'low';
      default: return 'low';
    }
  }

  /**
   * Get help text for auth-specific rules
   */
  getAuthRuleHelp(rule) {
    const helpTexts = {
      'auth-input-label': 'Associate labels with input elements using label, aria-label, or aria-labelledby',
      'auth-placeholder-only': 'Do not rely on placeholder text as the only label for input fields',
      'auth-autocomplete-email': 'Use autocomplete="email" or autocomplete="username" for email fields',
      'auth-autocomplete-password': 'Use autocomplete="current-password" for password fields',
      'auth-required-indication': 'Clearly indicate required fields with asterisks, text, or aria-required',
      'auth-error-association': 'Associate error messages with inputs using aria-describedby or role="alert"',
      'auth-color-only-error': 'Provide text indicators for errors, not just color changes',
      'auth-keyboard-navigation': 'Ensure all form elements are keyboard accessible',
      'auth-submit-button-label': 'Provide accessible text for submit buttons',
      'auth-captcha-alternative': 'Provide audio or alternative CAPTCHA options'
    };
    return helpTexts[rule] || 'Refer to WCAG 2.2 guidelines for authentication forms';
  }

  /**
   * Calculate accessibility score
   */
  calculateScore(violations) {
    const penalty = violations.reduce((acc, v) => {
      const p = v.severity === 'high' ? 8 : (v.severity === 'medium' ? 4 : 1);
      return acc + p;
    }, 0);
    return Math.max(0, 100 - penalty);
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

export default WcagEngine;
