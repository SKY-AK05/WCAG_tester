import AuthAgent from '../auth/authAgent.js';
import WcagEngine from '../wcag/wcagEngine.js';
import ReasoningLayer from '../reasoning/reasoningLayer.js';

/**
 * Orchestrator - Controls the entire authentication and WCAG audit flow
 */
class Orchestrator {
  constructor() {
    this.authAgent = new AuthAgent();
    this.wcagEngine = new WcagEngine();
    this.reasoningLayer = new ReasoningLayer();
  }

  /**
   * Main execution flow for authenticated WCAG auditing
   */
  async runAuthenticatedAudit(targetUrl, credentials = null) {
    const results = {
      url: targetUrl,
      timestamp: new Date().toISOString(),
      phases: {},
      summary: {
        requiresAuth: false,
        authSuccess: false,
        totalIssues: 0,
        authIssues: 0,
        pageIssues: 0,
        overallScore: 100
      }
    };

    try {
      // Phase 1: Initialize components
      await this.initialize();

      // Phase 2: Detect if authentication is required
      console.log(`🔍 Detecting authentication for: ${targetUrl}`);
      results.phases.detection = await this.authAgent.detectAuthRequired(targetUrl);
      results.summary.requiresAuth = results.phases.detection.requiresAuth;

      if (!results.phases.detection.requiresAuth) {
        // No authentication required - direct scan
        console.log('📄 No authentication required, performing direct scan');
        results.phases.directScan = await this.performDirectScan(targetUrl);
        results.summary.totalIssues = results.phases.directScan.results.violations.length;
        results.summary.pageIssues = results.phases.directScan.results.violations.length;
        results.summary.overallScore = results.phases.directScan.results.score;
      } else {
        // Authentication required - perform auth flow
        console.log('🔐 Authentication required, starting auth flow');
        
        if (!credentials) {
          throw new Error('Credentials required for authentication but none provided');
        }

        // Phase 3: Audit login page (before login)
        console.log('📋 Auditing login page...');
        results.phases.loginAudit = await this.performLoginAudit();

        // Phase 4: Perform authentication
        console.log('🚪 Performing authentication...');
        results.phases.authentication = await this.authAgent.authenticate(credentials);
        results.summary.authSuccess = results.phases.authentication.success;

        if (!results.phases.authentication.success) {
          throw new Error(`Authentication failed: ${results.phases.authentication.error}`);
        }

        // Phase 5: Navigate to target page after login
        console.log('🎯 Navigating to target page after login...');
        const navResult = await this.authAgent.navigateToTarget(targetUrl);
        results.phases.navigation = { 
          success: true, 
          finalUrl: navResult.url,
          readiness: navResult.readiness
        };
        const finalUrl = navResult.url;

        // Phase 6: Audit target page (after login)
        console.log('📊 Auditing target page...');
        results.phases.targetAudit = await this.performTargetAudit(finalUrl);

        // Calculate summary
        const loginIssues = results.phases.loginAudit?.results?.violations?.length || 0;
        const targetIssues = results.phases.targetAudit?.results?.violations?.length || 0;
        
        results.summary.authIssues = loginIssues;
        results.summary.pageIssues = targetIssues;
        results.summary.totalIssues = loginIssues + targetIssues;
        
        // Calculate weighted score (auth issues have higher weight)
        const loginScore = results.phases.loginAudit?.results?.score || 100;
        const targetScore = results.phases.targetAudit?.results?.score || 100;
        results.summary.overallScore = Math.round((loginScore * 0.6) + (targetScore * 0.4));

        // Add scan status if page was still loading
        if (navResult.readiness && !navResult.readiness.success) {
          results.summary.scanStatus = navResult.readiness.status; // "Partial Scan - Page Still Loading"
        } else {
          results.summary.scanStatus = "Full Scan - Page Ready";
        }
      }

      // Phase 7: Apply reasoning layer
      console.log('🧠 Applying AI reasoning to results...');
      results.phases.reasoning = await this.reasoningLayer.processResults(results);

      console.log('✅ Authenticated WCAG audit completed successfully');
      return results;

    } catch (error) {
      console.error('❌ Authenticated audit failed:', error.message);
      results.error = error.message;
      return results;
    } finally {
      await this.cleanup();
    }
  }

  /**
   * Initialize all components
   */
  async initialize() {
    await this.authAgent.initialize();
    await this.wcagEngine.initialize();
  }

  /**
   * Perform direct scan (no authentication required)
   */
  async performDirectScan(url) {
    const auditResults = await this.wcagEngine.runAuditOnPage(this.authAgent.page, url, 'page');
    
    if (!auditResults.success) {
      throw new Error(`Direct scan failed: ${auditResults.error}`);
    }

    return auditResults;
  }

  /**
   * Audit login page
   */
  async performLoginAudit() {
    const currentUrl = this.authAgent.getCurrentUrl();
    const auditResults = await this.wcagEngine.runAuditOnPage(this.authAgent.page, currentUrl, 'auth');
    
    if (!auditResults.success) {
      throw new Error(`Login audit failed: ${auditResults.error}`);
    }

    return auditResults;
  }

  /**
   * Audit target page after login
   */
  async performTargetAudit(url) {
    const auditResults = await this.wcagEngine.runAuditOnPage(this.authAgent.page, url, 'page');
    
    if (!auditResults.success) {
      throw new Error(`Target audit failed: ${auditResults.error}`);
    }

    return auditResults;
  }

  /**
   * Get audit summary for quick overview
   */
  getAuditSummary(results) {
    const summary = {
      url: results.url,
      requiresAuth: results.summary.requiresAuth,
      authSuccess: results.summary.authSuccess,
      overallScore: results.summary.overallScore,
      totalIssues: results.summary.totalIssues,
      breakdown: {
        authIssues: results.summary.authIssues,
        pageIssues: results.summary.pageIssues
      },
      severityBreakdown: {
        high: 0,
        medium: 0,
        low: 0
      }
    };

    // Count severity levels
    if (results.phases.loginAudit?.results?.violations) {
      results.phases.loginAudit.results.violations.forEach(v => {
        summary.severityBreakdown[v.severity] = (summary.severityBreakdown[v.severity] || 0) + 1;
      });
    }

    if (results.phases.targetAudit?.results?.violations) {
      results.phases.targetAudit.results.violations.forEach(v => {
        summary.severityBreakdown[v.severity] = (summary.severityBreakdown[v.severity] || 0) + 1;
      });
    }

    if (results.phases.directScan?.results?.violations) {
      results.phases.directScan.results.violations.forEach(v => {
        summary.severityBreakdown[v.severity] = (summary.severityBreakdown[v.severity] || 0) + 1;
      });
    }

    return summary;
  }

  /**
   * Export results in different formats
   */
  exportResults(results, format = 'json') {
    switch (format.toLowerCase()) {
      case 'json':
        return JSON.stringify(results, null, 2);
      
      case 'summary':
        return JSON.stringify(this.getAuditSummary(results), null, 2);
      
      case 'html':
        return this.generateHtmlReport(results);
      
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Generate HTML report
   */
  generateHtmlReport(results) {
    const summary = this.getAuditSummary(results);
    
    return `
<!DOCTYPE html>
<html>
<head>
    <title>WCAG 2.2 Accessibility Audit Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .score { font-size: 48px; font-weight: bold; color: ${summary.overallScore >= 80 ? 'green' : summary.overallScore >= 60 ? 'orange' : 'red'}; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
        .issue { margin: 10px 0; padding: 10px; background: #f9f9f9; border-left: 4px solid #ccc; }
        .high { border-left-color: #d32f2f; }
        .medium { border-left-color: #f57c00; }
        .low { border-left-color: #388e3c; }
        .auth-issue { background: #fff3e0; }
        .page-issue { background: #e8f5e8; }
    </style>
</head>
<body>
    <div class="header">
        <h1>WCAG 2.2 Accessibility Audit Report</h1>
        <p><strong>URL:</strong> ${summary.url}</p>
        <p><strong>Date:</strong> ${new Date(results.timestamp).toLocaleString()}</p>
        <div class="score">${summary.overallScore}/100</div>
        <p>Authentication Required: ${summary.requiresAuth ? 'Yes' : 'No'}</p>
        <p>Authentication Success: ${summary.authSuccess ? 'Yes' : 'No'}</p>
        <p>Total Issues: ${summary.totalIssues}</p>
    </div>

    ${summary.requiresAuth ? `
    <div class="section">
        <h2>Authentication Issues (${summary.breakdown.authIssues})</h2>
        ${this.renderIssues(results.phases.loginAudit?.results?.violations || [], 'auth')}
    </div>
    ` : ''}

    <div class="section">
        <h2>Page Issues (${summary.breakdown.pageIssues})</h2>
        ${this.renderIssues(results.phases.targetAudit?.results?.violations || results.phases.directScan?.results?.violations || [], 'page')}
    </div>

    ${results.phases.reasoning ? `
    <div class="section">
        <h2>AI Recommendations</h2>
        ${results.phases.reasoning.recommendations?.map(rec => `<p><strong>${rec.issue}:</strong> ${rec.suggestion}</p>`).join('') || '<p>No recommendations available.</p>'}
    </div>
    ` : ''}
</body>
</html>`;
  }

  /**
   * Render issues for HTML report
   */
  renderIssues(violations, type) {
    if (!violations || violations.length === 0) {
      return '<p>No issues found. Great job!</p>';
    }

    return violations.map(issue => `
      <div class="issue ${issue.severity} ${type}-issue">
        <h4>${issue.rule} - ${issue.severity.toUpperCase()}</h4>
        <p><strong>Message:</strong> ${issue.message}</p>
        <p><strong>Element:</strong> <code>${issue.element}</code></p>
        ${issue.help ? `<p><strong>Help:</strong> ${issue.help}</p>` : ''}
      </div>
    `).join('');
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    await this.authAgent.cleanup();
    await this.wcagEngine.cleanup();
  }
}

export default Orchestrator;
