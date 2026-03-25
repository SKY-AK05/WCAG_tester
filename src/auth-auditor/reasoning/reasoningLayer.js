/**
 * Reasoning Layer - Converts WCAG violations into human-readable explanations and fix suggestions
 */
class ReasoningLayer {
  constructor() {
    // Templates for different types of issues
    this.explanationTemplates = {
      'auth-input-label': {
        explanation: 'Screen reader users cannot identify what this input field is for without a proper label.',
        impact: 'Users with visual impairments cannot understand the purpose of the form field.',
        fix: 'Add a <label> element with the "for" attribute matching the input\'s ID, or use aria-label/aria-labelledby.'
      },
      'auth-placeholder-only': {
        explanation: 'Placeholder text disappears when the user starts typing, leaving no label for the field.',
        impact: 'Users with cognitive disabilities or screen reader users lose context when typing.',
        fix: 'Add a persistent label element in addition to or instead of placeholder text.'
      },
      'auth-autocomplete-email': {
        explanation: 'Without proper autocomplete attributes, browsers cannot suggest stored credentials.',
        impact: 'Users with motor disabilities benefit from auto-fill functionality to reduce typing.',
        fix: 'Add autocomplete="email" for email fields or autocomplete="username" for username fields.'
      },
      'auth-autocomplete-password': {
        explanation: 'Password managers cannot properly identify and fill password fields.',
        impact: 'Users with cognitive or motor difficulties benefit from password manager assistance.',
        fix: 'Add autocomplete="current-password" to password fields.'
      },
      'auth-required-indication': {
        explanation: 'Users cannot identify which fields are required before submitting the form.',
        impact: 'Users with cognitive disabilities may submit incomplete forms repeatedly.',
        fix: 'Add an asterisk (*) or "Required" text, and use aria-required="true" on the input.'
      },
      'auth-error-association': {
        explanation: 'Error messages are not programmatically linked to their corresponding input fields.',
        impact: 'Screen reader users cannot determine which field has an error.',
        fix: 'Use aria-describedby to link the input to the error message, or place error immediately after the input.'
      },
      'auth-color-only-error': {
        explanation: 'Users who cannot perceive color differences cannot identify error states.',
        impact: 'Users with color blindness or low vision miss important error information.',
        fix: 'Add text indicators, icons, or patterns in addition to color changes.'
      },
      'auth-keyboard-navigation': {
        explanation: 'Form elements cannot be accessed using keyboard alone.',
        impact: 'Users with motor disabilities cannot complete the authentication process.',
        fix: 'Ensure all interactive elements have tabindex≥0 and are reachable via Tab key.'
      },
      'auth-submit-button-label': {
        explanation: 'Submit button has no accessible text for screen readers.',
        impact: 'Users with visual impairments cannot understand the button\'s purpose.',
        fix: 'Add text content, aria-label, or aria-labelledby to the button.'
      },
      'auth-captcha-alternative': {
        explanation: 'CAPTCHA presents barriers to users with visual or cognitive disabilities.',
        impact: 'Many users cannot complete authentication due to inaccessible CAPTCHA.',
        fix: 'Provide audio CAPTCHA, alternative challenges, or implement less restrictive verification methods.'
      }
    };

    // General WCAG rule explanations
    this.generalExplanations = {
      'color-contrast': {
        explanation: 'Text color does not have sufficient contrast against its background.',
        impact: 'Users with low vision cannot read the content clearly.',
        fix: 'Increase color contrast ratio to meet WCAG AA standards (4.5:1 for normal text, 3:1 for large text).'
      },
      'image-alt': {
        explanation: 'Images are missing alternative text descriptions.',
        impact: 'Screen reader users cannot understand the content or purpose of images.',
        fix: 'Add descriptive alt text to all meaningful images. Use alt="" for decorative images.'
      },
      'label': {
        explanation: 'Form elements are missing proper labels.',
        impact: 'Screen reader users cannot understand the purpose of form fields.',
        fix: 'Associate labels with form controls using label elements or aria-label/aria-labelledby.'
      },
      'link-name': {
        explanation: 'Links have no descriptive text.',
        impact: 'Screen reader users cannot understand where links lead.',
        fix: 'Add descriptive text inside links or use aria-label to provide context.'
      },
      'button-name': {
        explanation: 'Buttons have no accessible names.',
        impact: 'Users cannot understand the purpose of buttons.',
        fix: 'Add text content, aria-label, or aria-labelledby to buttons.'
      },
      'aria-roles': {
        explanation: 'ARIA roles are used incorrectly or are missing.',
        impact: 'Assistive technology cannot properly interpret element purposes.',
        fix: 'Use appropriate ARIA roles according to ARIA specification and remove redundant roles.'
      }
    };
  }

  /**
   * Process audit results and add human-readable explanations
   */
  async processResults(results) {
    const processedResults = {
      recommendations: [],
      priorityFixes: [],
      quickWins: [],
      majorIssues: []
    };

    try {
      // Process all violations from all phases
      const allViolations = this.collectAllViolations(results);

      for (const violation of allViolations) {
        const reasoning = this.generateReasoning(violation);
        
        // Add reasoning to the violation
        violation.explanation = reasoning.explanation;
        violation.impact = reasoning.impact;
        violation.fix = reasoning.fix;
        violation.priority = this.calculatePriority(violation);

        // Categorize recommendations
        if (violation.severity === 'high' || violation.type === 'auth') {
          processedResults.priorityFixes.push({
            rule: violation.rule,
            issue: violation.message,
            suggestion: reasoning.fix,
            element: violation.selector,
            type: violation.type
          });
        } else if (violation.severity === 'medium') {
          processedResults.majorIssues.push({
            rule: violation.rule,
            issue: violation.message,
            suggestion: reasoning.fix,
            element: violation.selector,
            type: violation.type
          });
        } else {
          processedResults.quickWins.push({
            rule: violation.rule,
            issue: violation.message,
            suggestion: reasoning.fix,
            element: violation.selector,
            type: violation.type
          });
        }

        processedResults.recommendations.push({
          rule: violation.rule,
          issue: violation.message,
          suggestion: reasoning.fix,
          severity: violation.severity,
          type: violation.type,
          priority: violation.priority
        });
      }

      // Sort recommendations by priority
      processedResults.recommendations.sort((a, b) => {
        const priorityOrder = { 'critical': 0, 'high': 1, 'medium': 2, 'low': 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });

      // Generate summary
      processedResults.summary = this.generateSummary(allViolations);

      return processedResults;

    } catch (error) {
      console.error('Reasoning layer error:', error);
      return {
        recommendations: [],
        priorityFixes: [],
        quickWins: [],
        majorIssues: [],
        error: error.message
      };
    }
  }

  /**
   * Collect all violations from all audit phases
   */
  collectAllViolations(results) {
    const violations = [];

    // Collect from login audit
    if (results.phases.loginAudit?.results?.violations) {
      violations.push(...results.phases.loginAudit.results.violations);
    }

    // Collect from target audit
    if (results.phases.targetAudit?.results?.violations) {
      violations.push(...results.phases.targetAudit.results.violations);
    }

    // Collect from direct scan
    if (results.phases.directScan?.results?.violations) {
      violations.push(...results.phases.directScan.results.violations);
    }

    return violations;
  }

  /**
   * Generate human-readable reasoning for a violation
   */
  generateReasoning(violation) {
    // Check for auth-specific explanations first
    if (this.explanationTemplates[violation.rule]) {
      return this.explanationTemplates[violation.rule];
    }

    // Check for general WCAG explanations
    if (this.generalExplanations[violation.rule]) {
      return this.generalExplanations[violation.rule];
    }

    // Generate generic explanation
    return {
      explanation: `This accessibility issue affects users with disabilities and may prevent them from using the application effectively.`,
      impact: 'Users with disabilities may experience barriers when trying to interact with this element.',
      fix: 'Refer to WCAG 2.2 guidelines for specific implementation details to resolve this issue.'
    };
  }

  /**
   * Calculate priority for fixing the issue
   */
  calculatePriority(violation) {
    if (violation.type === 'auth') {
      // Authentication issues have highest priority
      return 'critical';
    }

    if (violation.severity === 'high') {
      return 'critical';
    } else if (violation.severity === 'medium') {
      return 'high';
    } else if (violation.severity === 'low') {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Generate summary of findings
   */
  generateSummary(violations) {
    const summary = {
      totalIssues: violations.length,
      authIssues: violations.filter(v => v.type === 'auth').length,
      pageIssues: violations.filter(v => v.type === 'page').length,
      severityBreakdown: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0
      },
      mostCommonIssues: [],
      recommendations: []
    };

    // Count severity levels
    violations.forEach(v => {
      const priority = this.calculatePriority(v);
      summary.severityBreakdown[priority]++;
    });

    // Find most common issues
    const ruleCounts = {};
    violations.forEach(v => {
      ruleCounts[v.rule] = (ruleCounts[v.rule] || 0) + 1;
    });

    summary.mostCommonIssues = Object.entries(ruleCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([rule, count]) => ({ rule, count }));

    // Generate high-level recommendations
    summary.recommendations = [
      'Fix all authentication-related issues first as they block user access',
      'Address high-severity issues that impact users with disabilities',
      'Implement proper labeling for all form elements',
      'Ensure keyboard navigation works throughout the application',
      'Test with actual assistive technology users'
    ];

    return summary;
  }

  /**
   * Get specific fix suggestions for a rule
   */
  getFixSuggestion(rule, element) {
    const template = this.explanationTemplates[rule] || this.generalExplanations[rule];
    
    if (template) {
      return {
        explanation: template.explanation,
        impact: template.impact,
        fix: template.fix,
        codeExample: this.getCodeExample(rule, element)
      };
    }

    return {
      explanation: 'This accessibility issue should be addressed to improve user experience.',
      impact: 'May create barriers for users with disabilities.',
      fix: 'Consult WCAG 2.2 guidelines for specific implementation requirements.',
      codeExample: null
    };
  }

  /**
   * Get code examples for common fixes
   */
  getCodeExample(rule, element) {
    const examples = {
      'auth-input-label': `
<!-- Before -->
<input type="email" name="email" placeholder="Enter your email">

<!-- After -->
<label for="email">Email Address</label>
<input type="email" id="email" name="email" autocomplete="email">`,

      'auth-autocomplete-password': `
<!-- Before -->
<input type="password" name="pass">

<!-- After -->
<input type="password" id="password" name="password" autocomplete="current-password">`,

      'auth-error-association': `
<!-- Before -->
<input type="email" id="email">
<div class="error">Invalid email format</div>

<!-- After -->
<input type="email" id="email" aria-describedby="email-error">
<div id="email-error" class="error" role="alert">Invalid email format</div>`
    };

    return examples[rule] || null;
  }
}

export default ReasoningLayer;
