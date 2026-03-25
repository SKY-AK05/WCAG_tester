# WCAG 2.2 Authenticated Auditing System

A modular, production-ready system for auditing web applications that require authentication, with special focus on authentication accessibility as a first-class feature.

## 🏗️ Architecture

The system is built with strict separation of concerns across 5 layers:

### 1. Orchestrator Layer (`core/orchestrator.js`)
- Controls the entire execution flow
- Detects authentication requirements
- Coordinates between all other layers
- Handles retries, failures, and flow decisions

### 2. Auth Agent Layer (`auth/authAgent.js`)
- Dynamic login form detection (no hardcoded selectors)
- Intelligent field identification (username/email/password)
- Multi-step login flow support
- Session management and verification
- Returns structured authentication results

### 3. WCAG Engine Layer (`wcag/wcagEngine.js`)
- Integrates axe-core for general accessibility checks
- Implements 14 authentication-specific WCAG rules
- Processes and structures violations
- Calculates accessibility scores

### 4. Auth Rules (`wcag/authRules.js`)
- Comprehensive authentication WCAG 2.2 rules
- Covers forms, errors, navigation, CAPTCHA, and more
- Testable and extensible rule definitions
- WCAG level and impact classification

### 5. Reasoning Layer (`reasoning/reasoningLayer.js`)
- Converts violations to human-readable explanations
- Provides specific fix suggestions
- Prioritizes issues by impact
- Generates actionable recommendations

## 🚀 Quick Start

### Installation
```bash
cd src/auth-auditor
npm install
```

### Basic Usage
```javascript
import Orchestrator from './core/orchestrator.js';

const orchestrator = new Orchestrator();

// Scan public page (no auth required)
const publicResults = await orchestrator.runAuthenticatedAudit('https://example.com');

// Scan authenticated page
const credentials = {
  username: 'user@example.com',
  password: 'password123'
};

const authResults = await orchestrator.runAuthenticatedAudit(
  'https://app.example.com/dashboard',
  credentials
);

// Export results
const jsonReport = orchestrator.exportResults(authResults, 'json');
const htmlReport = orchestrator.exportResults(authResults, 'html');
```

## 📋 Authentication-Specific WCAG Rules

The system implements 14 authentication-specific rules:

### High Impact Rules
- **auth-input-label**: Input fields must have associated labels
- **auth-error-association**: Error messages must be programmatically associated
- **auth-keyboard-navigation**: Form must be fully keyboard navigable
- **auth-submit-button-label**: Submit buttons must have accessible names
- **auth-no-focus-traps**: Focus must not be trapped in form fields

### Medium Impact Rules
- **auth-autocomplete-email/password**: Proper autocomplete attributes
- **auth-placeholder-only**: Don't rely only on placeholders
- **auth-color-only-error**: Error indication beyond just color
- **auth-captcha-alternative**: CAPTCHA accessible alternatives
- **auth-focus-order**: Logical focus movement through form

### Low Impact Rules
- **auth-required-indication**: Clear required field indicators
- **auth-orientation**: Works in both orientations
- **auth-no-gesture-required**: No complex gestures required

## 🔄 Execution Flow

1. **Detection**: Analyze target URL for authentication requirements
2. **Login Audit**: Scan login page for accessibility issues
3. **Authentication**: Perform automated login with provided credentials
4. **Navigation**: Navigate to target page after successful login
5. **Target Audit**: Scan post-login page for accessibility issues
6. **Reasoning**: Apply AI layer for explanations and recommendations
7. **Reporting**: Generate structured results with clear separation

## 📊 Output Format

Results clearly separate authentication and page issues:

```json
{
  "summary": {
    "requiresAuth": true,
    "authSuccess": true,
    "totalIssues": 5,
    "authIssues": 3,
    "pageIssues": 2,
    "overallScore": 90
  },
  "phases": {
    "loginAudit": { /* Authentication-specific violations */ },
    "targetAudit": { /* Post-login page violations */ },
    "reasoning": { /* AI explanations and fixes */ }
  }
}
```

## 🎯 Key Features

### Dynamic Detection
- No hardcoded selectors
- Works across different websites
- Handles various login form patterns
- Multi-step authentication support

### Comprehensive Coverage
- 14 authentication-specific WCAG rules
- Full axe-core integration for general issues
- Covers forms, errors, navigation, CAPTCHA
- WCAG 2.2 AA compliance focus

### Intelligent Analysis
- Prioritizes authentication issues (blocks access)
- Provides specific fix suggestions
- Code examples for common issues
- Human-readable explanations

### Production Ready
- Graceful error handling
- Session management
- Retry mechanisms
- Multiple export formats

## 🛠️ Advanced Usage

### Custom Authentication Flow
```javascript
// Handle complex authentication scenarios
const credentials = {
  username: 'user@example.com',
  password: 'password123',
  // Add custom fields as needed
  mfaCode: '123456'
};

const results = await orchestrator.runAuthenticatedAudit(
  'https://complex-app.example.com',
  credentials
);
```

### Export Formats
```javascript
// Detailed JSON
const fullReport = orchestrator.exportResults(results, 'json');

// Quick summary
const summary = orchestrator.exportResults(results, 'summary');

// HTML report
const htmlReport = orchestrator.exportResults(results, 'html');
```

### Error Handling
```javascript
const results = await orchestrator.runAuthenticatedAudit(url, credentials);

if (results.error) {
  console.log('Audit failed:', results.error);
} else {
  console.log('Audit completed:', results.summary);
}
```

## 🔧 Configuration

### Browser Options
The system uses Playwright with configurable options:
- Headless/headed mode
- Viewport settings
- CSP bypass for institutional sites
- Custom timeouts

### Rule Customization
```javascript
// Add custom authentication rules
import { AuthRules } from './wcag/authRules.js';

const authRules = new AuthRules();
const customRules = authRules.getRulesByLevel('AA');
```

## 🧪 Testing

Run the example suite:
```bash
npm start
```

Run tests:
```bash
npm test
```

## 📈 Scoring Algorithm

The system uses a weighted scoring approach:
- **Authentication Issues**: 60% weight (blocks access)
- **Page Issues**: 40% weight (post-login experience)
- **Severity Weights**: Critical (8pts), Serious (4pts), Moderate (1pt)

## 🚨 Limitations

- Does not support CAPTCHA solving (provides accessibility analysis instead)
- Requires valid credentials for authenticated pages
- Some complex MFA flows may need custom handling
- OAuth flows may need additional configuration

## 🔐 Security Considerations

- Credentials are only used during the session
- No persistent storage of passwords
- Session cookies are managed securely
- Supports token-based authentication alternatives

## 🤝 Contributing

1. Follow the modular architecture
2. Add new authentication rules to `authRules.js`
3. Test with real-world authentication flows
4. Maintain separation of concerns between layers

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Built with [Playwright](https://playwright.dev/) for browser automation
- Uses [axe-core](https://github.com/dequelabs/axe-core) for accessibility testing
- Follows [WCAG 2.2](https://www.w3.org/TR/WCAG22/) guidelines
