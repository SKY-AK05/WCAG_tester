# WCAG Accessibility Rules Implementation Guide

## Overview

This document explains how the accessibility scanner implements and checks WCAG 2.2 rules using axe-core, custom rule mappings, and AI enrichment.

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   axe-core      │───▶│ IssueNormalizer │───▶│  Enhanced Report │
│   (100+ rules)  │    │ (WCAG mapping)  │    │  (AI enriched)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Raw Results   │    │  Structured      │    │  User Interface │
│   (violations)  │    │  Issues          │    │  (display)     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Rule Implementation Layers

### 1. axe-core Engine (Primary Detection)

**Location**: `node_modules/axe-core/axe.min.js`
**Purpose**: Core accessibility testing engine
**Rules**: 100+ built-in rules covering all WCAG principles

**How it works**:
- Injects into target page
- Analyzes DOM structure and attributes
- Returns violations and passes with detailed node information

**Example Rule: `image-alt`**
```javascript
// axe-core checks:
// 1. <img> elements have alt attribute
// 2. alt is not empty unless decorative
// 3. <img> inside <a> has meaningful alt
```

### 2. WCAG Rule Dictionary (Enhancement Layer)

**Location**: `server/wcagRules.js`
**Purpose**: Maps axe rules to WCAG 2.2 with fixes and examples
**Rules**: 100+ comprehensive rule definitions

**Structure**:
```javascript
{
  'rule-id': {
    wcag_id: '1.1.1',
    criterion: 'Non-text Content',
    level: 'A',
    category: 'Perceivable',
    impact: 'Screen reader users cannot understand...',
    fix: 'Add descriptive alt text...',
    code_example: {
      bad: '<img src="chart.png">',
      good: '<img src="chart.png" alt="Bar chart showing Q3 sales">'
    }
  }
}
```

### 3. Issue Normalizer (Processing Layer)

**Location**: `server/issueNormalizer.js`
**Purpose**: Transforms raw axe results into structured format
**Process**: Normalizes severity, maps to WCAG, adds metadata

**Key Functions**:
- `normalizeIssue()` - Single issue processing
- `normalizeViolations()` - Batch processing
- `createIssueSummary()` - Statistics generation

### 4. AI Enrichment (Intelligence Layer)

**Location**: `server/aiEnrichmentService.js`
**Purpose**: Generates human-readable explanations and fixes
**Process**: Batched API calls with caching

## Implemented Rules by WCAG Principle

### 📖 Perceivable (1.x)

#### 1.1 Non-text Content
- **image-alt**: Images must have alt text
- **role-img-alt**: Elements with role="img" need labels
- **object-alt**: Objects need text alternatives
- **svg-img-alt**: SVG images need accessible labels
- **input-image-alt**: Image inputs need alt text

**Check Method**: axe-core validates presence and quality of alt attributes
**Fix**: Add descriptive alt text or alt="" for decorative images

#### 1.2 Time-based Media
- **audio-caption**: Audio content needs captions
- **video-caption**: Videos need synchronized captions
- **video-description**: Videos need audio descriptions

**Check Method**: Checks for track elements with kind="captions"
**Fix**: Add WebVTT caption files or transcripts

#### 1.3 Adaptable Content
- **heading-order**: Proper heading hierarchy
- **p-as-heading**: Styled paragraphs not used as headings
- **empty-heading**: No empty heading elements
- **page-has-heading-one**: Single h1 per page
- **list**: Proper list markup (ul/ol/li)
- **listitem**: List items in proper containers
- **definition-list**: Definition lists use dl/dt/dd
- **table-duplicate-name**: Unique table captions
- **td-headers-attr**: Table headers properly associated
- **th-has-data-cells**: Headers have corresponding data

**Check Method**: Analyzes semantic structure and nesting
**Fix**: Use proper semantic HTML elements

#### 1.4 Distinguishable Content
- **color-contrast**: Text contrast ratio ≥ 4.5:1
- **no-images-of-text**: Use text instead of images of text
- **resize-text**: Text scales to 200% without breaking
- **line-height**: Line height ≥ 1.5
- **avoid-inline-spacing**: Use relative spacing units
- **link-in-text-block**: Links identified by more than color
- **image-redundant-alt**: Alt text doesn't repeat nearby text
- **meta-viewport**: Viewport allows zooming

**Check Method**: CSS analysis and color calculations
**Fix**: Adjust colors, use relative units, add indicators

### ⌨️ Operable (2.x)

#### 2.1 Keyboard Accessible
- **keyboard**: All functionality keyboard accessible
- **no-keyboard-trap**: No keyboard focus traps
- **focus-order-semantics**: Logical tab order
- **scrollable-region-focusable**: Scrollable areas focusable
- **frame-focusable-content**: Frame content keyboard accessible
- **server-side-image-map**: Use client-side image maps

**Check Method**: Tab navigation simulation and focus analysis
**Fix**: Add tabindex, remove traps, ensure logical order

#### 2.2 Enough Time
- **meta-refresh**: No auto-refresh
- **no-autoplay-audio**: Auto-playing audio has controls

**Check Method**: Meta tag and media element analysis
**Fix**: Remove auto-refresh, add controls

#### 2.3 Seizures and Physical Reactions
- **blink**: No blinking content
- **marquee**: No scrolling text

**Check Method**: Element and animation detection
**Fix**: Remove or replace with CSS animations

#### 2.4 Navigable
- **bypass**: Skip links for navigation blocks
- **skip-link-target-exists**: Skip link targets exist
- **page-titled**: Descriptive page titles
- **focus-visible**: Visible focus indicators
- **tabindex**: No positive tabindex values
- **frame-title**: Iframes have titles
- **frame-title-unique**: Unique iframe titles
- **link-name**: Links have descriptive text
- **button-name**: Buttons have accessible names
- **label-title-only**: Don't rely only on title attributes
- **identical-links-same-purpose**: Differentiate identical links
- **aria-hidden-focus**: No focusable elements in aria-hidden
- **aria-hidden-body**: Body not aria-hidden

**Check Method**: Link analysis, title validation, focus testing
**Fix**: Add titles, labels, skip links, proper naming

#### 2.5 Input Modalities
- **target-size**: Touch targets ≥ 44x44px
- **autocomplete-valid**: Appropriate autocomplete attributes
- **label-content-name-mismatch**: Accessible name includes visible label

**Check Method**: Size measurement and attribute validation
**Fix**: Increase target size, add autocomplete, ensure naming consistency

### 🧠 Understandable (3.x)

#### 3.1 Language
- **html-has-lang**: HTML element has lang attribute
- **html-lang-valid**: Valid language codes
- **valid-lang**: Language changes marked with lang
- **html-xml-lang-mismatch**: Consistent language declarations

**Check Method**: Attribute validation and code checking
**Fix**: Add valid BCP 47 language codes

#### 3.2 Reading Direction
- **html-xml-lang-mismatch**: Consistent direction declarations

#### 3.3 Predictable
- **aria-errormessage**: Error messages associated with inputs
- **error-identification**: Errors clearly identified
- **error-suggestion**: Suggestions for fixing errors
- **label**: Form controls have labels
- **form-field-multiple-labels**: No multiple labels per control
- **select-name**: Select elements have labels
- **input-autocomplete**: Input purpose identified

**Check Method**: Form structure and label association analysis
**Fix**: Add labels, error messages, autocomplete attributes

#### 3.4 Input Assistance
- **aria-conditional-attr**: Required conditional attributes present
- **aria-valid-attr-value**: Valid ARIA attribute values
- **aria-valid-attr**: Valid ARIA attributes used

### 🛡️ Robust (4.x)

#### 4.1 Compatible
- **duplicate-id**: Unique IDs throughout page
- **duplicate-id-active**: Unique IDs for active elements
- **duplicate-id-aria**: Unique IDs for ARIA references
- **aria-allowed-attr**: Allowed ARIA attributes only
- **aria-allowed-role**: Allowed ARIA roles only
- **aria-roles**: Valid ARIA roles
- **aria-required-attr**: Required ARIA attributes present
- **aria-required-children**: Required child elements present
- **aria-required-parent**: Required parent elements present
- **aria-hidden-body**: Body not hidden from AT
- **aria-hidden-focus**: Focusable elements not hidden
- **aria-prohibited-attr**: No prohibited attributes
- **aria-deprecated-role**: No deprecated roles
- **aria-text**: Avoid role="text"
- **aria-braille-equivalent**: Braille content provided
- **aria-toggle-field-name**: Toggle controls named
- **aria-input-field-name**: Input fields named
- **aria-command-name**: Command elements named
- **aria-dialog-name**: Dialogs named
- **aria-progressbar-name**: Progress bars named
- **aria-tooltip-name**: Tooltips named
- **aria-treeitem-name**: Tree items named
- **presentation-role-conflict**: No presentation role conflicts
- **aria-roledescription**: Minimal roledescription usage
- **aria-level**: Valid heading levels
- **dlitem**: Definition list items properly nested
- **region-role**: Generic regions have labels
- **frame-tested**: Iframe content testable
- **unsupported-role**: No unsupported roles
- **video-audio-description**: Video descriptions provided
- **table-fake-caption**: Real captions used
- **table-contains-thead-tbody**: Proper table structure
- **landmark-banner-is-top-level**: Banner at top level
- **landmark-contentinfo-is-top-level**: Footer at top level
- **landmark-main-is-top-level**: Main content at top level
- **landmark-no-duplicate-banner**: Unique banners
- **landmark-no-duplicate-contentinfo**: Unique footers
- **landmark-one-main**: Single main landmark
- **landmark-unique**: Unique landmark labels
- **landmark-complementary-is-top-level**: Aside at top level
- **menuitem-role**: Menu items in proper containers
- **scope-attr-valid**: Valid table scope attributes

**Check Method**: DOM analysis, attribute validation, structure checking
**Fix**: Add required attributes, fix invalid usage, ensure proper nesting

## Rule Checking Process

### 1. Scan Initiation
```javascript
// User starts scan → Browser launches → Page loads
socket.emit('start-scan', { url: targetUrl })
```

### 2. axe-core Execution
```javascript
// Inject axe-core → Run analysis → Get results
await page.addScriptTag({ path: axePath });
const axeResults = await page.evaluate(() => axe.run());
```

### 3. Result Normalization
```javascript
// Transform raw results → Map to WCAG → Add metadata
const report = await processScanResults(axeResults, page, targetUrl, pageTitle);
```

### 4. AI Enrichment (Optional)
```javascript
// Batch violations → Generate explanations → Cache results
const enriched = await aiService.enrichIssues(violations);
```

### 5. Display
```javascript
// Render dashboard → Show issues → Enable interactions
renderDashboard();
```

## Severity Levels

| axe-core Impact | Normalized Severity | Description |
|----------------|-------------------|-------------|
| critical | critical | Blocks users from completing primary tasks |
| serious | high | Creates significant barriers |
| moderate | medium | Affects some users, workarounds exist |
| minor | low | Minor inconvenience or cosmetic |

## WCAG Levels

| Level | Requirement | Example Rules |
|-------|-------------|--------------|
| A | Essential for basic access | image-alt, keyboard, page-titled |
| AA | Removes major barriers | color-contrast, resize-text, focus-visible |
| AAA | Enhanced accessibility | target-size, line-height, heading-order |

## Testing Strategy

### Automated Testing
- **axe-core**: 100+ rules with 95%+ coverage
- **Custom Rules**: Additional checks for specific patterns
- **Continuous Updates**: Rules updated with WCAG 2.2

### Manual Testing
- **Visual Review**: Screenshot evidence for violations
- **Keyboard Navigation**: Tab order and focus testing
- **Screen Reader**: NVDA/JAWS compatibility checks

### AI Enhancement
- **Explanation Generation**: Human-readable impact statements
- **Fix Suggestions**: Specific code-level recommendations
- **Best Practices**: Prevention tips for future development

## Configuration

### Environment Variables
```bash
# .env file
GEMINI_API_KEY=your_gemini_api_key_here
BROWSERLESS_API_KEY=your_browserless_key
PORT=3001
```

### Rule Customization
```javascript
// Add custom rules in wcagRules.js
export const WCAG_RULES = {
  'custom-rule': {
    wcag_id: '1.4.3',
    criterion: 'Contrast',
    level: 'AA',
    // ... rule definition
  }
};
```

## Performance Optimization

### Batch Processing
- **AI Enrichment**: 5 issues per API call
- **Screenshots**: First element only
- **Caching**: Repeated rules cached

### Memory Management
- **Single Scan Lock**: Prevents concurrent scans
- **Browser Cleanup**: Automatic resource cleanup
- **Result Limiting**: Limits elements per issue

## Troubleshooting

### Common Issues

1. **No Results Showing**
   - Check severity filter compatibility
   - Verify AI API key configuration
   - Check browser console for errors

2. **Screenshot Failures**
   - Element not visible (timeout)
   - Cross-origin restrictions
   - Element scrolled out of view

3. **AI Enrichment Fails**
   - Invalid API key
   - Rate limiting reached
   - Network connectivity issues

### Debug Mode
```javascript
// Enable debug logging
console.log('[DEBUG]', axeResults);
console.log('[DEBUG]', report);
```

## Future Enhancements

### Planned Features
- **Custom Rule Engine**: Domain-specific rules
- **Regression Testing**: Track improvements over time
- **Export Formats**: PDF, Excel, JSON reports
- **Integration**: CI/CD pipeline integration
- **Mobile Testing**: Responsive accessibility checks

### Rule Updates
- **WCAG 2.2 Compliance**: Latest success criteria
- **Browser Updates**: New accessibility APIs
- **Framework Support**: React, Vue, Angular patterns

## References

- [WCAG 2.2 Guidelines](https://www.w3.org/WAI/WCAG22/quickref/)
- [axe-core Documentation](https://dequeuniversity.com/rules/axe/4.9/)
- [ARIA Authoring Practices](https://www.w3.org/TR/wai-aria-practices-1.1/)
- [HTML Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)

---

*Last Updated: 2026-03-26*
*Version: 2.0*
