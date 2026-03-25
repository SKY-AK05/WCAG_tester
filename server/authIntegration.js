// Import the authenticated auditor
import Orchestrator from '../src/auth-auditor/core/orchestrator.js';

/**
 * Integration layer to connect authenticated auditor with existing WCAG tool
 */
class AuthIntegration {
  constructor() {
    this.orchestrator = new Orchestrator();
  }

  /**
   * Enhanced scan function that supports authentication
   */
  async runAuthenticatedScan(targetUrl, options = {}) {
    const { credentials, enableAuth = false } = options;
    
    try {
      // Use the authenticated auditor if auth is enabled
      if (enableAuth && credentials) {
        console.log(`🔐 Running authenticated scan for: ${targetUrl}`);
        const authResults = await this.orchestrator.runAuthenticatedAudit(targetUrl, credentials);
        
        // Convert to format compatible with existing frontend
        return this.convertToExistingFormat(authResults);
      } else {
        // Fall back to existing scan logic
        console.log(`📄 Running standard scan for: ${targetUrl}`);
        return null; // Let existing logic handle this
      }
    } catch (error) {
      console.error('Authenticated scan failed:', error);
      throw error;
    }
  }

  /**
   * Convert auth auditor results to match existing frontend format
   */
  convertToExistingFormat(authResults) {
    const violations = [];
    const passes = [];

    // Collect all violations from both auth and page audits
    if (authResults.phases.loginAudit?.results?.violations) {
      authResults.phases.loginAudit.results.violations.forEach(v => {
        violations.push({
          rule_id: v.rule,
          title: v.message,
          description: v.help || v.message,
          status: 'fail',
          severity: v.severity === 'high' ? 'critical' : (v.severity === 'medium' ? 'serious' : 'moderate'),
          level: 'AA',
          category: 'Authentication',
          elements: [{
            html: v.element,
            selector: v.selector,
            summary: v.message,
            screenshot: null
          }],
          why_matters: v.explanation || 'Authentication issues prevent users from accessing the application',
          ai_suggestion: v.fix || 'Follow WCAG 2.2 guidelines for authentication forms'
        });
      });
    }

    if (authResults.phases.targetAudit?.results?.violations) {
      authResults.phases.targetAudit.results.violations.forEach(v => {
        violations.push({
          rule_id: v.rule,
          title: v.message,
          description: v.help || v.message,
          status: 'fail',
          severity: v.severity === 'high' ? 'critical' : (v.severity === 'medium' ? 'serious' : 'moderate'),
          level: 'AA',
          category: 'Page Content',
          elements: [{
            html: v.element,
            selector: v.selector,
            summary: v.message,
            screenshot: null
          }],
          why_matters: v.explanation || 'This affects accessibility compliance',
          ai_suggestion: v.fix || 'Refer to WCAG 2.2 guidelines'
        });
      });
    }

    // Collect passes
    if (authResults.phases.loginAudit?.results?.passes) {
      authResults.phases.loginAudit.results.passes.forEach(p => {
        passes.push({
          rule_id: p.rule,
          title: p.message,
          description: p.help || p.message,
          status: 'pass',
          severity: 'minor',
          level: 'AA',
          category: 'Authentication',
          elements: [{
            html: p.element,
            selector: p.selector,
            summary: 'This element passes the accessibility check',
            screenshot: null
          }],
          why_matters: 'This accessibility rule has been successfully implemented',
          ai_suggestion: 'No action needed - this rule is properly implemented'
        });
      });
    }

    if (authResults.phases.targetAudit?.results?.passes) {
      authResults.phases.targetAudit.results.passes.forEach(p => {
        passes.push({
          rule_id: p.rule,
          title: p.message,
          description: p.help || p.message,
          status: 'pass',
          severity: 'minor',
          level: 'AA',
          category: 'Page Content',
          elements: [{
            html: p.element,
            selector: p.selector,
            summary: 'This element passes the accessibility check',
            screenshot: null
          }],
          why_matters: 'This accessibility rule has been successfully implemented',
          ai_suggestion: 'No action needed - this rule is properly implemented'
        });
      });
    }

    // Combine all issues
    const allIssues = [...violations, ...passes];

    return {
      url: authResults.url,
      title: 'Authenticated Accessibility Audit',
      score: authResults.summary.overallScore,
      issues: allIssues,
      timestamp: authResults.timestamp,
      authInfo: {
        required: authResults.summary.requiresAuth,
        success: authResults.summary.authSuccess,
        authIssues: authResults.summary.authIssues,
        pageIssues: authResults.summary.pageIssues,
        scanStatus: authResults.summary.scanStatus || "Unknown"
      }
    };
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    await this.orchestrator.cleanup();
  }
}

export default AuthIntegration;
