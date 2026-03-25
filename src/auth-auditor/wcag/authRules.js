/**
 * Authentication-specific WCAG 2.2 Rules
 * Defines rules for evaluating accessibility of authentication flows
 */
export class AuthRules {
  constructor() {
    this.rules = {
      // WCAG 1.3.1 - Info and Relationships
      'auth-input-label': {
        description: 'Input fields must have associated labels',
        wcagLevel: 'A',
        impact: 'high',
        test: (element) => {
          const hasLabel = document.querySelector(`label[for="${element.id}"]`) || 
                          element.closest('label') ||
                          element.getAttribute('aria-label') ||
                          element.getAttribute('aria-labelledby');
          return hasLabel;
        }
      },

      // WCAG 1.3.6 - Identify Purpose
      'auth-autocomplete-email': {
        description: 'Email fields must have appropriate autocomplete attributes',
        wcagLevel: 'AA',
        impact: 'medium',
        test: (element) => {
          if (element.type === 'email' || element.name?.includes('email')) {
            return element.getAttribute('autocomplete') === 'email' || 
                   element.getAttribute('autocomplete') === 'username';
          }
          return true;
        }
      },

      'auth-autocomplete-password': {
        description: 'Password fields must have current-password autocomplete',
        wcagLevel: 'AA',
        impact: 'medium',
        test: (element) => {
          if (element.type === 'password') {
            return element.getAttribute('autocomplete') === 'current-password';
          }
          return true;
        }
      },

      // WCAG 3.3.2 - Labels or Instructions
      'auth-placeholder-only': {
        description: 'Inputs must not rely only on placeholders for identification',
        wcagLevel: 'A',
        impact: 'medium',
        test: (element) => {
          const hasLabel = document.querySelector(`label[for="${element.id}"]`) || 
                          element.closest('label') ||
                          element.getAttribute('aria-label');
          
          return hasLabel || !element.placeholder;
        }
      },

      // WCAG 3.3.3 - Error Suggestion
      'auth-error-association': {
        description: 'Error messages must be programmatically associated with inputs',
        wcagLevel: 'AA',
        impact: 'high',
        test: (element) => {
          const errorId = element.getAttribute('aria-describedby');
          if (errorId) {
            const errorElement = document.getElementById(errorId);
            return errorElement && errorElement.textContent.trim().length > 0;
          }
          
          // Check if error is immediately adjacent
          const nextElement = element.nextElementSibling;
          const prevElement = element.previousElementSibling;
          
          return (nextElement && nextElement.classList.contains('error')) ||
                 (prevElement && prevElement.classList.contains('error'));
        }
      },

      // WCAG 1.4.1 - Use of Color
      'auth-color-only-error': {
        description: 'Error indication must not rely on color alone',
        wcagLevel: 'A',
        impact: 'medium',
        test: (element) => {
          if (element.getAttribute('aria-invalid') === 'true' || 
              element.classList.contains('error') || 
              element.classList.contains('invalid')) {
            
            // Check for text-based error indication
            const hasErrorText = element.getAttribute('aria-describedby') ||
                                element.nextElementSibling?.classList.contains('error') ||
                                element.previousElementSibling?.classList.contains('error') ||
                                element.closest('div')?.querySelector('.error-message');
            
            return hasErrorText;
          }
          return true;
        }
      },

      // WCAG 2.1.1 - Keyboard
      'auth-keyboard-navigation': {
        description: 'Form must be fully keyboard navigable',
        wcagLevel: 'A',
        impact: 'high',
        test: () => {
          const focusableElements = document.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          
          // Check if form elements have proper tabindex
          return Array.from(focusableElements).every(el => el.tabIndex >= 0);
        }
      },

      // WCAG 3.3.4 - Error Prevention
      'auth-required-indication': {
        description: 'Required fields must be clearly indicated',
        wcagLevel: 'AA',
        impact: 'low',
        test: (element) => {
          if (!element.required) return true;
          
          const hasAriaRequired = element.getAttribute('aria-required') === 'true';
          const hasVisualIndicator = 
            element.closest('label')?.textContent.includes('*') ||
            element.parentElement?.querySelector('.required, .asterisk, [aria-label*="required"]') ||
            element.getAttribute('aria-label')?.includes('required');
          
          return hasAriaRequired || hasVisualIndicator;
        }
      },

      // WCAG 4.1.2 - Name, Role, Value
      'auth-submit-button-label': {
        description: 'Submit buttons must have accessible names',
        wcagLevel: 'A',
        impact: 'high',
        test: (element) => {
          const hasText = element.textContent?.trim() || 
                         element.value || 
                         element.getAttribute('aria-label') ||
                         element.getAttribute('aria-labelledby');
          return hasText;
        }
      },

      // WCAG 1.2.1 - Audio-only and Video-only (Prerecorded)
      'auth-captcha-alternative': {
        description: 'CAPTCHA must provide accessible alternatives',
        wcagLevel: 'AA',
        impact: 'medium',
        test: (element) => {
          if (element.src?.includes('captcha') || 
              element.id?.includes('captcha') || 
              element.className?.includes('captcha')) {
            
            // Look for audio or text alternatives
            const hasAlternative = 
              element.nextElementSibling?.textContent.includes('audio') ||
              element.nextElementSibling?.textContent.includes('alternative') ||
              document.querySelector('a[href*="audio"], a[href*="alternative"]') ||
              element.parentElement?.querySelector('[alt*="audio"], [alt*="alternative"]');
            
            return hasAlternative;
          }
          return true;
        }
      },

      // WCAG 2.4.3 - Focus Order
      'auth-focus-order': {
        description: 'Focus must move logically through form fields',
        wcagLevel: 'A',
        impact: 'medium',
        test: () => {
          const inputs = document.querySelectorAll('input, button, select, textarea');
          const tabIndexes = Array.from(inputs).map(input => input.tabIndex);
          
          // Check for logical tab order (no negative tabindex unless intentional)
          const hasNegativeTabIndex = tabIndexes.some(index => index < 0);
          if (hasNegativeTabIndex) return false;
          
          // Check if tabindex values are in logical order
          const sortedIndexes = [...tabIndexes].sort((a, b) => a - b);
          return JSON.stringify(tabIndexes) === JSON.stringify(sortedIndexes);
        }
      },

      // WCAG 3.2.1 - On Focus
      'auth-no-focus-traps': {
        description: 'Focus must not be trapped in form fields',
        wcagLevel: 'A',
        impact: 'high',
        test: () => {
          // Check for common focus trap patterns
          const hasModalOverlay = document.querySelector('.modal[role="dialog"]');
          const hasFocusTrap = document.querySelector('[data-focus-trap="true"]');
          
          // If modal exists, it should have proper focus management
          if (hasModalOverlay) {
            return hasModalOverlay.getAttribute('aria-modal') === 'true';
          }
          
          return !hasFocusTrap;
        }
      },

      // WCAG 1.3.4 - Orientation
      'auth-orientation': {
        description: 'Form must work in both portrait and landscape',
        wcagLevel: 'AA',
        impact: 'low',
        test: () => {
          // Check for orientation-locking meta tags
          const orientationLock = document.querySelector('meta[name="screen-orientation"]');
          const viewportOrientation = document.querySelector('meta[name="viewport"][content*="orientation"]');
          
          return !orientationLock && !viewportOrientation;
        }
      },

      // WCAG 2.5.1 - Pointer Gestures
      'auth-no-gesture-required': {
        description: 'Form submission must not require complex gestures',
        wcagLevel: 'A',
        impact: 'medium',
        test: () => {
          // Check for swipe-only submit buttons or gesture-based inputs
          const swipeButtons = document.querySelectorAll('[data-gesture], [data-swipe]');
          return swipeButtons.length === 0;
        }
      }
    };
  }

  /**
   * Get all authentication rules
   */
  getAllRules() {
    return this.rules;
  }

  /**
   * Get rules by WCAG level
   */
  getRulesByLevel(level) {
    const filteredRules = {};
    Object.entries(this.rules).forEach(([key, rule]) => {
      if (rule.wcagLevel === level) {
        filteredRules[key] = rule;
      }
    });
    return filteredRules;
  }

  /**
   * Get rules by impact level
   */
  getRulesByImpact(impact) {
    const filteredRules = {};
    Object.entries(this.rules).forEach(([key, rule]) => {
      if (rule.impact === impact) {
        filteredRules[key] = rule;
      }
    });
    return filteredRules;
  }

  /**
   * Get rule by ID
   */
  getRule(ruleId) {
    return this.rules[ruleId];
  }

  /**
   * Check if element passes a specific rule
   */
  testRule(ruleId, element) {
    const rule = this.rules[ruleId];
    if (!rule) return { passed: false, error: 'Rule not found' };
    
    try {
      const passed = rule.test(element);
      return { passed, rule };
    } catch (error) {
      return { passed: false, error: error.message };
    }
  }

  /**
   * Run all auth rules on a page
   */
  runAllRules(document) {
    const results = {
      passed: [],
      violations: [],
      incomplete: []
    };

    Object.entries(this.rules).forEach(([ruleId, rule]) => {
      try {
        // Find relevant elements for this rule
        const elements = this.findRelevantElements(ruleId, document);
        
        let allPassed = true;
        const violations = [];

        elements.forEach(element => {
          const passed = rule.test(element);
          if (!passed) {
            allPassed = false;
            violations.push({
              element: element.outerHTML.substring(0, 200),
              selector: this.getElementSelector(element),
              rule: ruleId,
              description: rule.description,
              impact: rule.impact
            });
          }
        });

        if (allPassed && elements.length > 0) {
          results.passed.push({
            rule: ruleId,
            description: rule.description,
            wcagLevel: rule.wcagLevel,
            elementsChecked: elements.length
          });
        } else if (violations.length > 0) {
          results.violations.push(...violations);
        }

      } catch (error) {
        results.incomplete.push({
          rule: ruleId,
          error: error.message,
          description: rule.description
        });
      }
    });

    return results;
  }

  /**
   * Find elements relevant to a specific rule
   */
  findRelevantElements(ruleId, document) {
    const ruleSelectors = {
      'auth-input-label': 'input[type="text"], input[type="email"], input[type="password"]',
      'auth-autocomplete-email': 'input[type="email"], input[name*="email"]',
      'auth-autocomplete-password': 'input[type="password"]',
      'auth-placeholder-only': 'input[placeholder]',
      'auth-error-association': 'input[aria-describedby], input[aria-invalid="true"]',
      'auth-color-only-error': 'input[aria-invalid="true"], .error input, .invalid input',
      'auth-keyboard-navigation': 'form',
      'auth-required-indication': 'input[required]',
      'auth-submit-button-label': 'button[type="submit"], input[type="submit"]',
      'auth-captcha-alternative': '[src*="captcha"], [id*="captcha"], [class*="captcha"]',
      'auth-focus-order': 'input, button, select, textarea',
      'auth-no-focus-traps': 'form',
      'auth-orientation': 'body',
      'auth-no-gesture-required': 'form'
    };

    const selector = ruleSelectors[ruleId] || 'input, button, form';
    return document.querySelectorAll(selector);
  }

  /**
   * Get unique selector for element
   */
  getElementSelector(element) {
    if (element.id) return `#${element.id}`;
    if (element.name) return `[name="${element.name}"]`;
    if (element.className) return `.${element.className.split(' ').join('.')}`;
    return element.tagName.toLowerCase();
  }
}

export default AuthRules;
