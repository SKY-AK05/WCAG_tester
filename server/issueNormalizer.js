/**
 * IssueNormalizer - Transforms raw axe-core results into structured accessibility issues
 * Maps axe violations to WCAG 2.2 rules with enhanced explanations, fixes, and code examples
 */

import { getWcagRule } from './wcagRules.js';
import { extractWcagTags, mapToWCAGLevel } from './wcagUtils.js';

/**
 * Severity mapping from axe-core impact to standard severity levels
 */
const SEVERITY_MAP = {
  critical: 'critical',
  serious: 'high',
  moderate: 'medium',
  minor: 'low'
};

/**
 * Normalize a single axe-core violation/pass into structured format
 * @param {Object} axeItem - Raw axe-core violation or pass item
 * @param {String} status - 'fail' for violations, 'pass' for passes
 * @param {Array} elements - Processed elements with screenshots and metadata
 * @returns {Object} Normalized structured issue
 */
export function normalizeIssue(axeItem, status = 'fail', elements = []) {
  // Get enhanced WCAG rule information
  const wcagRule = getWcagRule(axeItem.id);
  
  // Extract WCAG tags
  const wcagTags = extractWcagTags(axeItem.tags || []);
  
  // Build the structured issue
  const normalized = {
    // Core identification
    rule_id: axeItem.id,
    title: axeItem.help || wcagRule.criterion || 'Untitled Issue',
    description: axeItem.description || wcagRule.impact || 'No description available',
    
    // WCAG 2.2 mapping
    wcag_id: wcagRule.wcag_id,
    criterion: wcagRule.criterion,
    level: wcagRule.level || mapToWCAGLevel(axeItem.id),
    category: wcagRule.category || 'General',
    wcagTags: wcagTags,
    
    // Impact and severity
    impact: buildImpactStatement(axeItem, wcagRule, status),
    severity: status === 'fail' ? (SEVERITY_MAP[axeItem.impact] || 'medium') : 'info',
    
    // Fix information
    fix: buildFixStatement(axeItem, wcagRule, status),
    fix_suggestion: axeItem.help || wcagRule.fix || null,
    code_example: wcagRule.code_example || null,
    
    // Reference materials
    help_url: axeItem.helpUrl || wcagTags[0]?.url || `https://dequeuniversity.com/rules/axe/4.9/${axeItem.id}`,
    learn_more: wcagTags.map(tag => tag.url).filter(Boolean),
    
    // Status and elements
    status: status,
    elements: elements.map(el => ({
      html: el.html,
      selector: el.selector,
      summary: el.summary,
      screenshot: el.screenshot,
      target: el.target || el.selector
    })),
    
    // AI enrichment placeholders (filled later by AI service)
    ai_explanation: null,
    ai_fix: null,
    ai_best_practice: null,
    ai_enriched: false,
    
    // Metadata
    metadata: {
      timestamp: new Date().toISOString(),
      version: '2.0',
      engine: 'axe-core',
      tested: true
    }
  };

  return normalized;
}

/**
 * Build impact statement combining axe data with WCAG context
 */
function buildImpactStatement(axeItem, wcagRule, status) {
  if (status === 'pass') {
    return `This rule has been properly implemented. ${wcagRule.criterion} is satisfied.`;
  }
  
  const impacts = [];
  
  // Add axe-core impact if available
  if (axeItem.impact) {
    const impactMap = {
      critical: 'Critical: Blocks users from completing primary tasks.',
      serious: 'Serious: Creates significant barriers for users with disabilities.',
      moderate: 'Moderate: Affects some users but workarounds may exist.',
      minor: 'Minor: Minor inconvenience or cosmetic issue.'
    };
    impacts.push(impactMap[axeItem.impact] || `${axeItem.impact} impact detected.`);
  }
  
  // Add WCAG-specific impact
  if (wcagRule.impact) {
    impacts.push(wcagRule.impact);
  }
  
  // Add affected user groups based on category
  const userGroups = getAffectedUserGroups(wcagRule.category);
  if (userGroups) {
    impacts.push(`Primarily affects: ${userGroups}`);
  }
  
  return impacts.join(' ');
}

/**
 * Build fix statement combining axe data with WCAG guidance
 */
function buildFixStatement(axeItem, wcagRule, status) {
  if (status === 'pass') {
    return 'No action needed. This accessibility requirement is properly satisfied.';
  }
  
  const fixes = [];
  
  // Add rule-specific fix
  if (wcagRule.fix) {
    fixes.push(wcagRule.fix);
  }
  
  // Add axe help if available and different
  if (axeItem.help && axeItem.help !== wcagRule.fix) {
    fixes.push(axeItem.help);
  }
  
  return fixes.join(' ') || 'Review WCAG guidelines and implement appropriate fix.';
}

/**
 * Get affected user groups based on WCAG category
 */
function getAffectedUserGroups(category) {
  const groupMap = {
    'Perceivable': 'blind users, low vision users, deaf/hard-of-hearing users',
    'Operable': 'keyboard users, motor impaired users',
    'Understandable': 'users with cognitive disabilities, reading disabilities, non-native speakers',
    'Robust': 'screen reader users, assistive technology users'
  };
  
  return groupMap[category] || 'users with disabilities';
}

/**
 * Batch normalize multiple axe violations
 * @param {Array} violations - axe-core violations array
 * @param {Object} context - Page context for element processing
 * @returns {Array} Normalized issues
 */
export async function normalizeViolations(violations, context = {}) {
  const normalized = [];
  
  for (const violation of violations) {
    const elements = await processElements(violation.nodes, context);
    normalized.push(normalizeIssue(violation, 'fail', elements));
  }
  
  return normalized;
}

/**
 * Batch normalize passed rules
 * @param {Array} passes - axe-core passes array
 * @returns {Array} Normalized pass entries
 */
export function normalizePasses(passes) {
  return passes.map(pass => {
    // Limit elements for passes (performance)
    const limitedElements = pass.nodes.slice(0, 3).map(node => ({
      html: node.html,
      selector: node.target.join(' > '),
      summary: 'This element passes the accessibility check',
      target: node.target
    }));
    
    return normalizeIssue(pass, 'pass', limitedElements);
  });
}

/**
 * Process axe-core nodes into normalized elements
 * @param {Array} nodes - axe-core violation nodes
 * @param {Object} context - Contains page object for screenshots
 * @returns {Array} Processed elements
 */
async function processElements(nodes, context = {}) {
  const { page } = context;
  const elements = [];
  
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const selector = node.target.join(' > ');
    
    let screenshotBase64 = null;
    
    // Only capture screenshot for first element (performance optimization)
    if (i === 0 && page) {
      try {
        const locator = page.locator(selector).first();
        await locator.scrollIntoViewIfNeeded({ timeout: 2000 });
        const buffer = await locator.screenshot({ timeout: 3000 });
        screenshotBase64 = buffer.toString('base64');
      } catch (e) {
        // Screenshot failed but continue processing
      }
    }
    
    elements.push({
      html: node.html,
      selector: selector,
      target: node.target,
      summary: node.failureSummary || 'Accessibility violation detected',
      screenshot: screenshotBase64
    });
  }
  
  return elements;
}

/**
 * Create summary statistics for normalized issues
 * @param {Array} issues - Array of normalized issues
 * @returns {Object} Summary statistics
 */
export function createIssueSummary(issues) {
  const violations = issues.filter(i => i.status === 'fail');
  const passes = issues.filter(i => i.status === 'pass');
  
  const severityCounts = {
    critical: violations.filter(i => i.severity === 'critical').length,
    high: violations.filter(i => i.severity === 'high').length,
    medium: violations.filter(i => i.severity === 'medium').length,
    low: violations.filter(i => i.severity === 'low').length
  };
  
  const wcagLevelCounts = {
    A: violations.filter(i => i.level === 'A').length,
    AA: violations.filter(i => i.level === 'AA').length,
    AAA: violations.filter(i => i.level === 'AAA').length
  };
  
  const categoryCounts = {};
  violations.forEach(v => {
    categoryCounts[v.category] = (categoryCounts[v.category] || 0) + 1;
  });
  
  // Calculate score
  const penalty = violations.reduce((acc, v) => {
    const p = v.severity === 'critical' ? 8 : 
              v.severity === 'high' ? 4 : 
              v.severity === 'medium' ? 2 : 1;
    return acc + (p * Math.min(v.elements.length, 5));
  }, 0);
  
  const score = Math.max(0, 100 - penalty);
  
  return {
    total: issues.length,
    violations: violations.length,
    passes: passes.length,
    score,
    severity: severityCounts,
    wcag_levels: wcagLevelCounts,
    categories: categoryCounts,
    needs_immediate_attention: severityCounts.critical + severityCounts.high,
    compliant: score >= 90 && severityCounts.critical === 0
  };
}

/**
 * Group issues by WCAG principle
 * @param {Array} issues - Array of normalized issues
 * @returns {Object} Issues grouped by principle
 */
export function groupByPrinciple(issues) {
  const groups = {
    Perceivable: [],
    Operable: [],
    Understandable: [],
    Robust: []
  };
  
  issues.forEach(issue => {
    const category = issue.category || 'General';
    if (groups[category]) {
      groups[category].push(issue);
    } else {
      groups.Robust.push(issue); // Default to Robust for unknown categories
    }
  });
  
  return groups;
}

/**
 * Filter issues by various criteria
 * @param {Array} issues - Array of normalized issues
 * @param {Object} filters - Filter criteria
 * @returns {Array} Filtered issues
 */
export function filterIssues(issues, filters = {}) {
  return issues.filter(issue => {
    if (filters.status && issue.status !== filters.status) return false;
    if (filters.severity && issue.severity !== filters.severity) return false;
    if (filters.level && issue.level !== filters.level) return false;
    if (filters.category && issue.category !== filters.category) return false;
    if (filters.wcag_id && issue.wcag_id !== filters.wcag_id) return false;
    return true;
  });
}

/**
 * Sort issues by priority (severity and element count)
 * @param {Array} issues - Array of normalized issues
 * @returns {Array} Sorted issues
 */
export function sortIssuesByPriority(issues) {
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
  
  return [...issues].sort((a, b) => {
    // First by severity
    const severityDiff = (severityOrder[a.severity] || 99) - (severityOrder[b.severity] || 99);
    if (severityDiff !== 0) return severityDiff;
    
    // Then by element count (more instances = higher priority)
    return (b.elements?.length || 0) - (a.elements?.length || 0);
  });
}

/**
 * Export issues to various formats
 * @param {Array} issues - Array of normalized issues
 * @param {String} format - Export format: 'json', 'csv', 'html'
 * @returns {String} Formatted output
 */
export function exportIssues(issues, format = 'json') {
  switch (format) {
    case 'json':
      return JSON.stringify(issues, null, 2);
      
    case 'csv':
      const headers = ['rule_id', 'title', 'wcag_id', 'level', 'severity', 'status', 'impact', 'fix', 'element_count'];
      const rows = issues.map(i => [
        i.rule_id,
        `"${(i.title || '').replace(/"/g, '""')}"`,
        i.wcag_id,
        i.level,
        i.severity,
        i.status,
        `"${(i.impact || '').replace(/"/g, '""')}"`,
        `"${(i.fix || '').replace(/"/g, '""')}"`,
        i.elements?.length || 0
      ]);
      return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      
    case 'html':
      const rows_html = issues.map(i => `
        <tr>
          <td>${i.rule_id}</td>
          <td>${i.title}</td>
          <td>${i.wcag_id}</td>
          <td>${i.level}</td>
          <td>${i.severity}</td>
          <td>${i.status}</td>
          <td>${i.impact}</td>
        </tr>
      `).join('');
      return `
        <table border="1">
          <thead>
            <tr><th>Rule ID</th><th>Title</th><th>WCAG ID</th><th>Level</th><th>Severity</th><th>Status</th><th>Impact</th></tr>
          </thead>
          <tbody>${rows_html}</tbody>
        </table>
      `;
      
    default:
      return JSON.stringify(issues, null, 2);
  }
}

export default {
  normalizeIssue,
  normalizeViolations,
  normalizePasses,
  createIssueSummary,
  groupByPrinciple,
  filterIssues,
  sortIssuesByPriority,
  exportIssues
};
