/**
 * Enhanced WCAG 2.2 Rule Dictionary
 * Maps axe-core rule IDs to comprehensive WCAG information including fixes and code examples
 */

export const WCAG_RULES = {
  // --- Perceivable (1.x) ---
  'image-alt': {
    wcag_id: '1.1.1',
    criterion: 'Non-text Content',
    level: 'A',
    category: 'Perceivable',
    impact: 'Screen reader users cannot understand image purpose without alternative text.',
    fix: 'Add descriptive alt text that conveys the image\'s purpose and content.',
    code_example: {
      bad: '<img src="chart.png">',
      good: '<img src="chart.png" alt="Bar chart showing Q3 sales increased 25% to $1.2M">'
    }
  },
  'audio-caption': {
    wcag_id: '1.2.1',
    criterion: 'Audio-only and Video-only (Prerecorded)',
    level: 'A',
    category: 'Perceivable',
    impact: 'Deaf or hard-of-hearing users cannot access audio content.',
    fix: 'Provide captions or a text transcript for audio content.',
    code_example: {
      bad: '<audio src="podcast.mp3" controls></audio>',
      good: '<audio src="podcast.mp3" controls></audio>\n<p><a href="transcript.html">Read transcript</a></p>'
    }
  },
  'color-contrast': {
    wcag_id: '1.4.3',
    criterion: 'Contrast (Minimum)',
    level: 'AA',
    category: 'Perceivable',
    impact: 'Users with low vision, color blindness, or reading in bright light cannot see text clearly.',
    fix: 'Increase contrast ratio to at least 4.5:1 for normal text, 3:1 for large text.',
    code_example: {
      bad: 'color: #999; background: #fff;',
      good: 'color: #333; background: #fff; /* 12.6:1 ratio */'
    }
  },
  'resize-text': {
    wcag_id: '1.4.4',
    criterion: 'Resize Text',
    level: 'AA',
    category: 'Perceivable',
    impact: 'Users who need larger text for readability cannot use the content when zoomed.',
    fix: 'Use relative units (rem, em) instead of px. Ensure content doesn\'t overflow or overlap when zoomed to 200%.',
    code_example: {
      bad: 'font-size: 14px; width: 1200px;',
      good: 'font-size: 0.875rem; max-width: 75rem;'
    }
  },
  'no-images-of-text': {
    wcag_id: '1.4.5',
    criterion: 'Images of Text',
    level: 'AA',
    category: 'Perceivable',
    impact: 'Screen readers cannot read text in images. Users cannot resize or customize text appearance.',
    fix: 'Use real text styled with CSS instead of images containing text.',
    code_example: {
      bad: '<img src="heading.png" alt="Welcome to our site">',
      good: '<h1 style="font-family: Georgia; color: navy;">Welcome to our site</h1>'
    }
  },

  // --- Operable (2.x) ---
  'keyboard': {
    wcag_id: '2.1.1',
    criterion: 'Keyboard',
    level: 'A',
    category: 'Operable',
    impact: 'Users who cannot use a mouse (motor disabilities, screen reader users) cannot access functionality.',
    fix: 'Ensure all interactive elements are reachable and operable via keyboard (Tab, Enter, Space, Arrow keys).',
    code_example: {
      bad: '<div onclick="submit()" class="button">Submit</div>',
      good: '<button onclick="submit()">Submit</button>\n<!-- or -->\n<div role="button" tabindex="0" onclick="submit()" onkeypress="handleKey(event)">Submit</div>'
    }
  },
  'no-keyboard-trap': {
    wcag_id: '2.1.2',
    criterion: 'No Keyboard Trap',
    level: 'A',
    category: 'Operable',
    impact: 'Keyboard users get stuck and cannot navigate away from an element.',
    fix: 'Ensure users can Tab away from all focusable elements. For widgets, provide Esc or arrow key exit.',
    code_example: {
      bad: '<input onkeydown="return false">',
      good: '<input onkeydown="handleNavigation(event)"> // Allow Tab key to pass through'
    }
  },
  'focus-visible': {
    wcag_id: '2.4.7',
    criterion: 'Focus Visible',
    level: 'AA',
    category: 'Operable',
    impact: 'Keyboard users cannot see which element has focus, making navigation impossible.',
    fix: 'Add visible focus indicators (outline, border, box-shadow) with 3:1 contrast ratio.',
    code_example: {
      bad: ':focus { outline: none; }',
      good: ':focus { outline: 2px solid #0056b3; outline-offset: 2px; }'
    }
  },
  'bypass': {
    wcag_id: '2.4.1',
    criterion: 'Bypass Blocks',
    level: 'A',
    category: 'Operable',
    impact: 'Screen reader users must listen through repetitive navigation on every page.',
    fix: 'Add skip links to bypass navigation and jump to main content.',
    code_example: {
      bad: '<nav>30 navigation links...</nav>\n<main>Content starts here</main>',
      good: '<a href="#main-content" class="skip-link">Skip to main content</a>\n<nav>...</nav>\n<main id="main-content">Content starts here</main>'
    }
  },
  'page-titled': {
    wcag_id: '2.4.2',
    criterion: 'Page Titled',
    level: 'A',
    category: 'Operable',
    impact: 'Users cannot identify page purpose or distinguish between multiple open pages.',
    fix: 'Provide unique, descriptive <title> for each page that describes its purpose.',
    code_example: {
      bad: '<title>Home</title>',
      good: '<title>Contact Us - Acme Corporation</title>'
    }
  },
  'heading-order': {
    wcag_id: '2.4.10',
    criterion: 'Section Headings',
    level: 'AAA',
    category: 'Operable',
    impact: 'Screen reader users cannot navigate content structure efficiently.',
    fix: 'Use proper heading hierarchy (h1 → h2 → h3). Don\'t skip levels.',
    code_example: {
      bad: '<h1>Title</h1>\n<h3>Subtitle</h3>\n<h5>Details</h5>',
      good: '<h1>Title</h1>\n<h2>Subtitle</h2>\n<h3>Details</h3>'
    }
  },

  // --- Understandable (3.x) ---
  'label': {
    wcag_id: '3.3.2',
    criterion: 'Labels or Instructions',
    level: 'A',
    category: 'Understandable',
    impact: 'Users don\'t know what information to enter or the expected format.',
    fix: 'Associate visible labels with inputs using <label for="id"> or aria-labelledby.',
    code_example: {
      bad: '<input type="email" placeholder="Enter email">',
      good: '<label for="email">Email address</label>\n<input type="email" id="email" autocomplete="email">'
    }
  },
  'error-identification': {
    wcag_id: '3.3.1',
    criterion: 'Error Identification',
    level: 'A',
    category: 'Understandable',
    impact: 'Users don\'t know when they\'ve made a mistake or which fields have errors.',
    fix: 'Identify errors with text (not just color), associate error messages with inputs using aria-describedby.',
    code_example: {
      bad: '<input style="border: 1px solid red">',
      good: '<input aria-invalid="true" aria-describedby="email-error">\n<span id="email-error" class="error">Please enter a valid email address</span>'
    }
  },
  'error-suggestion': {
    wcag_id: '3.3.3',
    criterion: 'Error Suggestion',
    level: 'AA',
    category: 'Understandable',
    impact: 'Users don\'t know how to correct their mistakes.',
    fix: 'Provide specific suggestions for correcting errors (e.g., "Use format: name@example.com").',
    code_example: {
      bad: 'Invalid input',
      good: 'Invalid email format. Please use: name@example.com'
    }
  },
  'language': {
    wcag_id: '3.1.1',
    criterion: 'Language of Page',
    level: 'A',
    category: 'Understandable',
    impact: 'Screen readers pronounce words incorrectly when language is not specified.',
    fix: 'Set the lang attribute on the html element to the primary page language.',
    code_example: {
      bad: '<html>',
      good: '<html lang="en">'
    }
  },

  // --- Robust (4.x) ---
  'aria-roles': {
    wcag_id: '4.1.2',
    criterion: 'Name, Role, Value',
    level: 'A',
    category: 'Robust',
    impact: 'Screen readers cannot identify what an element is or how to interact with it.',
    fix: 'Use valid ARIA roles only. Custom widgets need proper role, state, and property attributes.',
    code_example: {
      bad: '<div role="invalid-role">Menu</div>',
      good: '<div role="navigation" aria-label="Main">...</div>'
    }
  },
  'aria-required-attr': {
    wcag_id: '4.1.2',
    criterion: 'Name, Role, Value',
    level: 'A',
    category: 'Robust',
    impact: 'Screen readers cannot convey required information about elements.',
    fix: 'Include all required attributes for ARIA roles (e.g., aria-valuemin/max for progressbar).',
    code_example: {
      bad: '<div role="progressbar" aria-valuenow="50">',
      good: '<div role="progressbar" aria-valuenow="50" aria-valuemin="0" aria-valuemax="100">'
    }
  },
  'valid-lang': {
    wcag_id: '3.1.2',
    criterion: 'Language of Parts',
    level: 'AA',
    category: 'Understandable',
    impact: 'Screen readers mispronounce content in different languages.',
    fix: 'Use lang attribute on elements containing different languages.',
    code_example: {
      bad: '<p>Bienvenue sur notre site</p>',
      good: '<p lang="fr">Bienvenue sur notre site</p>'
    }
  },
  'aria-valid-attr-value': {
    wcag_id: '4.1.2',
    criterion: 'Name, Role, Value',
    level: 'A',
    category: 'Robust',
    impact: 'Screen readers receive invalid or confusing state information.',
    fix: 'Use valid values for ARIA attributes (e.g., aria-expanded must be "true" or "false").',
    code_example: {
      bad: '<button aria-expanded="yes">Menu</button>',
      good: '<button aria-expanded="true">Menu</button>'
    }
  },
  'aria-allowed-attr': {
    wcag_id: '4.1.2',
    criterion: 'Name, Role, Value',
    level: 'A',
    category: 'Robust',
    impact: 'Screen readers receive conflicting information about element capabilities.',
    fix: 'Only use ARIA attributes that are supported by the element\'s role.',
    code_example: {
      bad: '<button aria-orientation="vertical">Submit</button>',
      good: '<button>Submit</button> <!-- Remove invalid aria-orientation -->'
    }
  },
  'aria-required-children': {
    wcag_id: '1.3.1',
    criterion: 'Info and Relationships',
    level: 'A',
    category: 'Perceivable',
    impact: 'Screen readers cannot navigate composite widgets correctly.',
    fix: 'Include required child roles (e.g., listbox needs option children).',
    code_example: {
      bad: '<ul role="listbox">\n  <li>Item 1</li>\n</ul>',
      good: '<ul role="listbox">\n  <li role="option" aria-selected="false">Item 1</li>\n</ul>'
    }
  },

  // --- Common axe-core rules mapped ---
  'link-name': {
    wcag_id: '2.4.4',
    criterion: 'Link Purpose (In Context)',
    level: 'A',
    category: 'Operable',
    impact: 'Screen reader users cannot determine link destination or purpose.',
    fix: 'Ensure links have accessible text (link content, aria-label, or aria-labelledby).',
    code_example: {
      bad: '<a href="/about"><img src="arrow.png"></a>',
      good: '<a href="/about">About Us</a>\n<!-- or -->\n<a href="/about" aria-label="Learn more about our company"><img src="arrow.png" alt=""></a>'
    }
  },
  'button-name': {
    wcag_id: '4.1.2',
    criterion: 'Name, Role, Value',
    level: 'A',
    category: 'Robust',
    impact: 'Screen reader users cannot identify button purpose.',
    fix: 'Ensure buttons have accessible text (button content, aria-label, or aria-labelledby).',
    code_example: {
      bad: '<button><i class="icon-save"></i></button>',
      good: '<button aria-label="Save document"><i class="icon-save"></i></button>\n<!-- or -->\n<button><i class="icon-save"></i> Save</button>'
    }
  },
  'region': {
    wcag_id: '2.4.1',
    criterion: 'Bypass Blocks',
    level: 'A',
    category: 'Operable',
    impact: 'Screen reader users cannot navigate between page regions efficiently.',
    fix: 'Use landmark regions (main, nav, aside, header, footer) or ARIA landmarks.',
    code_example: {
      bad: '<div id="navigation">...</div>\n<div id="content">...</div>',
      good: '<nav aria-label="Main">...</nav>\n<main>...</main>'
    }
  },
  'aria-input-field-name': {
    wcag_id: '4.1.2',
    criterion: 'Name, Role, Value',
    level: 'A',
    category: 'Robust',
    impact: 'Screen reader users cannot identify the purpose of input fields.',
    fix: 'Provide accessible names for ARIA input fields using aria-label or aria-labelledby.',
    code_example: {
      bad: '<div role="textbox" contenteditable></div>',
      good: '<div role="textbox" contenteditable aria-label="Comment"></div>'
    }
  },
  'aria-toggle-field-name': {
    wcag_id: '4.1.2',
    criterion: 'Name, Role, Value',
    level: 'A',
    category: 'Robust',
    impact: 'Screen reader users cannot identify the purpose of toggle controls.',
    fix: 'Provide accessible names for checkboxes, switches, and toggles.',
    code_example: {
      bad: '<div role="switch" aria-checked="false"></div>',
      good: '<div role="switch" aria-checked="false" aria-label="Dark mode"></div>'
    }
  },
  'list': {
    wcag_id: '1.3.1',
    criterion: 'Info and Relationships',
    level: 'A',
    category: 'Perceivable',
    impact: 'Screen readers cannot identify list structure and item count.',
    fix: 'Use proper list markup (ul, ol, li) for lists.',
    code_example: {
      bad: '<div class="list">\n  <div class="item">Item 1</div>\n</div>',
      good: '<ul>\n  <li>Item 1</li>\n</ul>'
    }
  },
  'listitem': {
    wcag_id: '1.3.1',
    criterion: 'Info and Relationships',
    level: 'A',
    category: 'Perceivable',
    impact: 'List items not properly nested in list containers confuse screen readers.',
    fix: 'Ensure <li> elements are direct children of <ul> or <ol> (or have proper ARIA roles).',
    code_example: {
      bad: '<div>\n  <li>Item 1</li>\n</div>',
      good: '<ul>\n  <li>Item 1</li>\n</ul>'
    }
  },
  'definition-list': {
    wcag_id: '1.3.1',
    criterion: 'Info and Relationships',
    level: 'A',
    category: 'Perceivable',
    impact: 'Screen readers cannot convey term-definition relationships.',
    fix: 'Use dl, dt, dd elements for term-definition pairs.',
    code_example: {
      bad: '<p><strong>HTML:</strong> Hypertext Markup Language</p>',
      good: '<dl>\n  <dt>HTML</dt>\n  <dd>Hypertext Markup Language</dd>\n</dl>'
    }
  },
  'table-duplicate-name': {
    wcag_id: '1.3.1',
    criterion: 'Info and Relationships',
    level: 'A',
    category: 'Perceivable',
    impact: 'Users cannot distinguish between tables with identical names.',
    fix: 'Provide unique captions or aria-label for each table.',
    code_example: {
      bad: '<table><caption>Products</caption>...</table>\n<table><caption>Products</caption>...</table>',
      good: '<table aria-label="Featured Products">...</table>\n<table aria-label="All Products">...</table>'
    }
  },
  'td-headers-attr': {
    wcag_id: '1.3.1',
    criterion: 'Info and Relationships',
    level: 'A',
    category: 'Perceivable',
    impact: 'Screen readers cannot associate data cells with their headers in complex tables.',
    fix: 'Use headers attribute to associate cells with specific header IDs in complex tables.',
    code_example: {
      bad: '<td>Data</td>',
      good: '<td headers="q1 sales">Data</td> <!-- For complex tables with multiple header levels -->'
    }
  },
  'th-has-data-cells': {
    wcag_id: '1.3.1',
    criterion: 'Info and Relationships',
    level: 'A',
    category: 'Perceivable',
    impact: 'Empty headers or headers without associated data cells confuse screen readers.',
    fix: 'Ensure each th element has corresponding data cells.',
    code_example: {
      bad: '<table>\n  <th>Unused Header</th>\n  <td>Data only for other columns</td>\n</table>',
      good: '<table>\n  <th>Product</th>\n  <td>Widget</td>\n</table>'
    }
  },
  'meta-viewport': {
    wcag_id: '1.4.4',
    criterion: 'Resize Text',
    level: 'AA',
    category: 'Perceivable',
    impact: 'Users cannot zoom text on mobile devices, preventing readability.',
    fix: 'Allow zooming by not setting user-scalable=no or maximum-scale < 2.',
    code_example: {
      bad: '<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">',
      good: '<meta name="viewport" content="width=device-width, initial-scale=1">'
    }
  },
  'meta-refresh': {
    wcag_id: '2.2.1',
    criterion: 'Timing Adjustable',
    level: 'A',
    category: 'Operable',
    impact: 'Users with reading or motor disabilities cannot complete tasks before page refreshes.',
    fix: 'Remove auto-refresh. Provide manual refresh option or extend time limit significantly.',
    code_example: {
      bad: '<meta http-equiv="refresh" content="30">',
      good: '<!-- Remove meta refresh. Use JavaScript with user-controlled refresh option -->'
    }
  },
  'identical-links-same-purpose': {
    wcag_id: '2.4.4',
    criterion: 'Link Purpose (In Context)',
    level: 'AA',
    category: 'Operable',
    impact: 'Users cannot distinguish between links with same text but different destinations.',
    fix: 'Use aria-label or visually hidden text to differentiate links with same visible text.',
    code_example: {
      bad: '<a href="/product/1">Learn more</a>\n<a href="/product/2">Learn more</a>',
      good: '<a href="/product/1" aria-label="Learn more about Product A">Learn more</a>\n<a href="/product/2" aria-label="Learn more about Product B">Learn more</a>'
    }
  },
  'skip-link': {
    wcag_id: '2.4.1',
    criterion: 'Bypass Blocks',
    level: 'A',
    category: 'Operable',
    impact: 'Keyboard users must tab through all navigation links on every page.',
    fix: 'Add visible skip link as first focusable element targeting main content.',
    code_example: {
      bad: '<!-- No skip link -->',
      good: '<a href="#main" class="skip-link">Skip to main content</a>\n<main id="main">...</main>'
    }
  },
  'tabindex': {
    wcag_id: '2.4.3',
    criterion: 'Focus Order',
    level: 'A',
    category: 'Operable',
    impact: 'Positive tabindex values disrupt natural tab order, confusing keyboard users.',
    fix: 'Avoid positive tabindex values. Use tabindex="0" for custom focusable elements only.',
    code_example: {
      bad: '<a href="/" tabindex="3">Home</a>\n<a href="/about" tabindex="1">About</a>',
      good: '<a href="/">Home</a>\n<a href="/about">About</a>'
    }
  },
  'target-size': {
    wcag_id: '2.5.5',
    criterion: 'Target Size',
    level: 'AAA',
    category: 'Operable',
    impact: 'Users with motor impairments cannot accurately activate small touch targets.',
    fix: 'Ensure touch targets are at least 44x44 CSS pixels (24x24 for AA compliance).',
    code_example: {
      bad: '<button style="width: 20px; height: 20px;">X</button>',
      good: '<button style="width: 44px; height: 44px;" aria-label="Close">X</button>'
    }
  },
  'autocomplete-valid': {
    wcag_id: '1.3.5',
    criterion: 'Identify Input Purpose',
    level: 'AA',
    category: 'Perceivable',
    impact: 'Users with cognitive disabilities must re-enter information. Users with motor disabilities must type instead of use autofill.',
    fix: 'Add appropriate autocomplete attribute to identify input purpose.',
    code_example: {
      bad: '<input type="text" name="fname">',
      good: '<input type="text" name="fname" autocomplete="given-name">'
    }
  },
  'landmark-banner-is-top-level': {
    wcag_id: '1.3.1',
    criterion: 'Info and Relationships',
    level: 'A',
    category: 'Perceivable',
    impact: 'Improper landmark nesting confuses screen reader navigation.',
    fix: 'Ensure banner (header) is top-level, not nested inside other landmarks.',
    code_example: {
      bad: '<main>\n  <header>...</header>\n</main>',
      good: '<header>...</header>\n<main>...</main>'
    }
  },
  'landmark-contentinfo-is-top-level': {
    wcag_id: '1.3.1',
    criterion: 'Info and Relationships',
    level: 'A',
    category: 'Perceivable',
    impact: 'Improper landmark nesting confuses screen reader navigation.',
    fix: 'Ensure contentinfo (footer) is top-level, not nested inside other landmarks.',
    code_example: {
      bad: '<main>\n  <footer>...</footer>\n</main>',
      good: '<main>...</main>\n<footer>...</footer>'
    }
  },
  'landmark-main-is-top-level': {
    wcag_id: '1.3.1',
    criterion: 'Info and Relationships',
    level: 'A',
    category: 'Perceivable',
    impact: 'Improper landmark nesting confuses screen reader navigation.',
    fix: 'Ensure main landmark is top-level, not nested inside other landmarks.',
    code_example: {
      bad: '<article>\n  <main>...</main>\n</article>',
      good: '<main>\n  <article>...</article>\n</main>'
    }
  },
  'landmark-no-duplicate-banner': {
    wcag_id: '1.3.1',
    criterion: 'Info and Relationships',
    level: 'A',
    category: 'Perceivable',
    impact: 'Multiple banner landmarks without labels make navigation confusing.',
    fix: 'Use only one banner per page, or add aria-label to distinguish multiple banners.',
    code_example: {
      bad: '<header>...</header>\n<header>...</header>',
      good: '<header aria-label="Site">...</header>\n<header aria-label="Article">...</header> <!-- Only if necessary -->'
    }
  },
  'landmark-no-duplicate-contentinfo': {
    wcag_id: '1.3.1',
    criterion: 'Info and Relationships',
    level: 'A',
    category: 'Perceivable',
    impact: 'Multiple contentinfo landmarks without labels make navigation confusing.',
    fix: 'Use only one contentinfo per page, or add aria-label to distinguish.',
    code_example: {
      bad: '<footer>...</footer>\n<footer>...</footer>',
      good: '<footer aria-label="Site">...</footer>\n<footer aria-label="Article">...</footer> <!-- Only if necessary -->'
    }
  },
  'landmark-one-main': {
    wcag_id: '1.3.1',
    criterion: 'Info and Relationships',
    level: 'A',
    category: 'Perceivable',
    impact: 'Multiple main landmarks confuse screen reader users about primary content.',
    fix: 'Use only one main landmark per page.',
    code_example: {
      bad: '<main>...</main>\n<main>...</main>',
      good: '<main id="content">...</main>'
    }
  },
  'landmark-unique': {
    wcag_id: '1.3.1',
    criterion: 'Info and Relationships',
    level: 'A',
    category: 'Perceivable',
    impact: 'Duplicate landmark labels make navigation confusing.',
    fix: 'Add unique aria-label or aria-labelledby to duplicate landmark types.',
    code_example: {
      bad: '<nav>...</nav>\n<nav>...</nav>',
      good: '<nav aria-label="Main">...</nav>\n<nav aria-label="Footer">...</nav>'
    }
  },
  'aria-allowed-role': {
    wcag_id: '4.1.2',
    criterion: 'Name, Role, Value',
    level: 'A',
    category: 'Robust',
    impact: 'Conflicting roles confuse screen readers about element behavior.',
    fix: 'Use only roles that are allowed for the element type.',
    code_example: {
      bad: '<button role="heading">Heading</button>',
      good: '<h2>Heading</h2>'
    }
  },
  'aria-command-name': {
    wcag_id: '4.1.2',
    criterion: 'Name, Role, Value',
    level: 'A',
    category: 'Robust',
    impact: 'Screen reader users cannot identify button or link purpose.',
    fix: 'Provide accessible names for command elements (aria-label, aria-labelledby, or visible text).',
    code_example: {
      bad: '<div role="button" onclick="submit()"></div>',
      good: '<div role="button" onclick="submit()" aria-label="Submit form" tabindex="0"></div>'
    }
  },
  'aria-dialog-name': {
    wcag_id: '4.1.2',
    criterion: 'Name, Role, Value',
    level: 'A',
    category: 'Robust',
    impact: 'Screen reader users cannot identify dialog purpose or content.',
    fix: 'Add aria-label or aria-labelledby to identify dialog purpose.',
    code_example: {
      bad: '<div role="dialog">\n  <h2>Confirm Delete</h2>\n</div>',
      good: '<div role="dialog" aria-labelledby="dialog-title">\n  <h2 id="dialog-title">Confirm Delete</h2>\n</div>'
    }
  },
  'aria-progressbar-name': {
    wcag_id: '4.1.2',
    criterion: 'Name, Role, Value',
    level: 'A',
    category: 'Robust',
    impact: 'Screen reader users cannot identify what progress is being tracked.',
    fix: 'Add aria-label to identify what the progress bar represents.',
    code_example: {
      bad: '<div role="progressbar" aria-valuenow="50">',
      good: '<div role="progressbar" aria-label="Upload progress" aria-valuenow="50">'
    }
  },
  'aria-tooltip-name': {
    wcag_id: '4.1.2',
    criterion: 'Name, Role, Value',
    level: 'A',
    category: 'Robust',
    impact: 'Screen reader users cannot identify tooltip content.',
    fix: 'Add aria-label or aria-labelledby to tooltips.',
    code_example: {
      bad: '<div role="tooltip">Helpful information</div>',
      good: '<div role="tooltip" id="tip1">Helpful information</div>\n<button aria-describedby="tip1">Info</button>'
    }
  },
  'aria-treeitem-name': {
    wcag_id: '4.1.2',
    criterion: 'Name, Role, Value',
    level: 'A',
    category: 'Robust',
    impact: 'Screen reader users cannot identify tree node content.',
    fix: 'Ensure treeitem elements have accessible names from content or aria-label.',
    code_example: {
      bad: '<li role="treeitem" aria-expanded="true">',
      good: '<li role="treeitem" aria-expanded="true">Documents</li>'
    }
  },
  'aria-hidden-body': {
    wcag_id: '4.1.2',
    criterion: 'Name, Role, Value',
    level: 'A',
    category: 'Robust',
    impact: 'Entire page is hidden from assistive technology, making it inaccessible.',
    fix: 'Remove aria-hidden="true" from body element.',
    code_example: {
      bad: '<body aria-hidden="true">',
      good: '<body>'
    }
  },
  'aria-hidden-focus': {
    wcag_id: '4.1.3',
    criterion: 'Status Messages',
    level: 'AA',
    category: 'Robust',
    impact: 'Focusable elements inside aria-hidden regions confuse screen readers.',
    fix: 'Remove focusable elements from aria-hidden regions or remove aria-hidden.',
    code_example: {
      bad: '<div aria-hidden="true">\n  <button>Click me</button>\n</div>',
      good: '<div aria-hidden="true">\n  <!-- No focusable elements -->\n</div>\n<button>Click me</button>'
    }
  },
  'aria-required-parent': {
    wcag_id: '1.3.1',
    criterion: 'Info and Relationships',
    level: 'A',
    category: 'Perceivable',
    impact: 'Child roles without required parents confuse screen reader navigation.',
    fix: 'Wrap child roles in their required parent containers.',
    code_example: {
      bad: '<li role="option">Item 1</li>\n<li role="option">Item 2</li>',
      good: '<ul role="listbox">\n  <li role="option">Item 1</li>\n  <li role="option">Item 2</li>\n</ul>'
    }
  },
  'aria-roledescription': {
    wcag_id: '4.1.2',
    criterion: 'Name, Role, Value',
    level: 'A',
    category: 'Robust',
    impact: 'Custom role descriptions may confuse users who rely on standard role announcements.',
    fix: 'Use standard ARIA roles. Only use aria-roledescription when absolutely necessary.',
    code_example: {
      bad: '<button aria-roledescription="slide control">Next</button>',
      good: '<button aria-label="Next slide">Next</button>'
    }
  },
  'frame-tested': {
    wcag_id: '4.1.1',
    criterion: 'Parsing',
    level: 'A',
    category: 'Robust',
    impact: 'Cannot verify accessibility of iframe content due to cross-origin restrictions.',
    fix: 'Ensure iframe content is accessible and from same origin when possible, or manually test.',
    code_example: {
      bad: '<iframe src="https://other-site.com/content"></iframe>',
      good: '<iframe src="/same-origin/content" title="Application Form"></iframe>'
    }
  },
  'frame-title': {
    wcag_id: '2.4.1',
    criterion: 'Bypass Blocks',
    level: 'A',
    category: 'Operable',
    impact: 'Screen reader users cannot identify iframe content purpose.',
    fix: 'Add title attribute to all iframes to describe their content.',
    code_example: {
      bad: '<iframe src="form.html"></iframe>',
      good: '<iframe src="form.html" title="Contact Form"></iframe>'
    }
  },
  'heading-order': {
    wcag_id: '1.3.1',
    criterion: 'Info and Relationships',
    level: 'A',
    category: 'Perceivable',
    impact: 'Skipped heading levels confuse screen reader users navigating by headings.',
    fix: 'Use proper heading hierarchy without skipping levels.',
    code_example: {
      bad: '<h1>Title</h1>\n<h3>Subtitle</h3>',
      good: '<h1>Title</h1>\n<h2>Subtitle</h2>'
    }
  },
  'empty-heading': {
    wcag_id: '1.3.1',
    criterion: 'Info and Relationships',
    level: 'A',
    category: 'Perceivable',
    impact: 'Empty headings appear in heading lists but provide no navigation value.',
    fix: 'Remove empty headings or add meaningful content.',
    code_example: {
      bad: '<h2></h2>\n<h3>   </h3>',
      good: '<h2>Related Articles</h2>'
    }
  },
  'p-as-heading': {
    wcag_id: '1.3.1',
    criterion: 'Info and Relationships',
    level: 'A',
    category: 'Perceivable',
    impact: 'Styled paragraphs look like headings but aren\'t recognized by screen readers.',
    fix: 'Use actual heading elements (h1-h6) instead of styled paragraphs for section headings.',
    code_example: {
      bad: '<p style="font-size: 24px; font-weight: bold;">Section Title</p>',
      good: '<h2>Section Title</h2>'
    }
  },
  'page-has-heading-one': {
    wcag_id: '1.3.1',
    criterion: 'Info and Relationships',
    level: 'A',
    category: 'Perceivable',
    impact: 'No h1 heading makes it harder for screen reader users to identify page purpose.',
    fix: 'Add a single h1 element that describes the page content.',
    code_example: {
      bad: '<h2>Welcome</h2>',
      good: '<h1>Welcome to Our Store</h1>\n<h2>Featured Products</h2>'
    }
  },
  'html-has-lang': {
    wcag_id: '3.1.1',
    criterion: 'Language of Page',
    level: 'A',
    category: 'Understandable',
    impact: 'Screen readers use wrong pronunciation when language is not specified.',
    fix: 'Add lang attribute to html element with correct language code.',
    code_example: {
      bad: '<html>',
      good: '<html lang="en">\n<!-- or -->\n<html lang="es">'
    }
  },
  'html-lang-valid': {
    wcag_id: '3.1.1',
    criterion: 'Language of Page',
    level: 'A',
    category: 'Understandable',
    impact: 'Invalid language codes cause screen readers to mispronounce content.',
    fix: 'Use valid BCP 47 language codes (e.g., "en", "en-US", "fr", "de").',
    code_example: {
      bad: '<html lang="english">',
      good: '<html lang="en">'
    }
  },
  'valid-lang': {
    wcag_id: '3.1.2',
    criterion: 'Language of Parts',
    level: 'AA',
    category: 'Understandable',
    impact: 'Content in different languages is mispronounced by screen readers.',
    fix: 'Use lang attribute on elements containing different languages.',
    code_example: {
      bad: '<p>Bonjour le monde</p>',
      good: '<p lang="fr">Bonjour le monde</p>'
    }
  },
  'document-title': {
    wcag_id: '2.4.2',
    criterion: 'Page Titled',
    level: 'A',
    category: 'Operable',
    impact: 'Users cannot identify page purpose or distinguish between browser tabs.',
    fix: 'Add a descriptive, unique title element in the head section.',
    code_example: {
      bad: '<head>\n  <meta charset="utf-8">\n</head>',
      good: '<head>\n  <title>Contact Us - Acme Corporation</title>\n</head>'
    }
  },
  'form-field-multiple-labels': {
    wcag_id: '3.3.2',
    criterion: 'Labels or Instructions',
    level: 'A',
    category: 'Understandable',
    impact: 'Multiple labels cause screen readers to announce conflicting information.',
    fix: 'Associate only one label with each form control, or use aria-labelledby correctly.',
    code_example: {
      bad: '<label for="email">Email</label>\n<label for="email">E-mail Address</label>\n<input id="email">',
      good: '<label for="email">Email Address</label>\n<input id="email" type="email">'
    }
  },
  'label-content-name-mismatch': {
    wcag_id: '2.5.3',
    criterion: 'Label in Name',
    level: 'A',
    category: 'Operable',
    impact: 'Speech recognition users cannot activate elements by speaking visible label text.',
    fix: 'Ensure accessible name includes the visible label text.',
    code_example: {
      bad: '<button aria-label="submit">Click Here</button>',
      good: '<button aria-label="Click Here to submit">Click Here</button>\n<!-- or -->\n<button>Click Here</button>'
    }
  },
  'select-name': {
    wcag_id: '4.1.2',
    criterion: 'Name, Role, Value',
    level: 'A',
    category: 'Robust',
    impact: 'Screen reader users cannot identify the purpose of dropdown menus.',
    fix: 'Associate a label with each select element.',
    code_example: {
      bad: '<select><option>...</option></select>',
      good: '<label for="country">Country</label>\n<select id="country"><option>...</option></select>'
    }
  },
  'link-in-text-block': {
    wcag_id: '1.4.1',
    criterion: 'Use of Color',
    level: 'A',
    category: 'Perceivable',
    impact: 'Colorblind users cannot identify links within text blocks.',
    fix: 'Add underline or other visual indicator besides color to identify links.',
    code_example: {
      bad: 'a { color: blue; text-decoration: none; }',
      good: 'a { color: #0056b3; text-decoration: underline; }'
    }
  },
  'image-redundant-alt': {
    wcag_id: '1.1.1',
    criterion: 'Non-text Content',
    level: 'A',
    category: 'Perceivable',
    impact: 'Screen reader users hear redundant information when image alt repeats adjacent text.',
    fix: 'Use empty alt="" for decorative images, or alt that complements (not repeats) adjacent text.',
    code_example: {
      bad: '<h2>About Us</h2>\n<img src="about.jpg" alt="About Us">',
      good: '<h2>About Us</h2>\n<img src="about.jpg" alt="Team members collaborating in modern office">'
    }
  },
  'blink': {
    wcag_id: '2.2.2',
    criterion: 'Pause, Stop, Hide',
    level: 'A',
    category: 'Operable',
    impact: 'Blinking content can trigger seizures in photosensitive users.',
    fix: 'Remove blinking elements or provide controls to stop/pause.',
    code_example: {
      bad: '<blink>Important!</blink>\n<marquee>News</marquee>',
      good: '<strong>Important!</strong>\n<!-- Use CSS animations with prefers-reduced-motion support -->'
    }
  },
  'marquee': {
    wcag_id: '2.2.2',
    criterion: 'Pause, Stop, Hide',
    level: 'A',
    category: 'Operable',
    impact: 'Moving content can distract users with attention disabilities and cannot be paused.',
    fix: 'Remove marquee elements. Use CSS animations with pause controls.',
    code_example: {
      bad: '<marquee>Breaking News</marquee>',
      good: '<div class="news-ticker" role="marquee" aria-label="Breaking news">\n  <!-- CSS controlled with pause button -->\n</div>'
    }
  },
  'accesskeys': {
    wcag_id: '2.4.1',
    criterion: 'Bypass Blocks',
    level: 'A',
    category: 'Operable',
    impact: 'Accesskeys can conflict with screen reader shortcuts, causing unexpected behavior.',
    fix: 'Avoid accesskeys or provide mechanism to customize or disable them.',
    code_example: {
      bad: '<a href="/" accesskey="h">Home</a>',
      good: '<a href="/">Home</a>'
    }
  },
  'css-orientation': {
    wcag_id: '1.3.4',
    criterion: 'Orientation',
    level: 'AA',
    category: 'Perceivable',
    impact: 'Users who have devices mounted in fixed orientation cannot view content.',
    fix: 'Remove CSS that locks orientation. Support both portrait and landscape.',
    code_example: {
      bad: '@media (orientation: landscape) { display: none; }',
      good: '<!-- Support both orientations with responsive design -->'
    }
  },
  'hidden-content': {
    wcag_id: '4.1.2',
    criterion: 'Name, Role, Value',
    level: 'A',
    category: 'Robust',
    impact: 'Visually hidden content may still be announced by screen readers unexpectedly.',
    fix: 'Use proper visually-hidden CSS that hides from both visual and AT users if needed.',
    code_example: {
      bad: 'display: none; /* removes from AT */\nvisibility: hidden; /* removes from AT */',
      good: '.visually-hidden {\n  position: absolute;\n  width: 1px;\n  height: 1px;\n  padding: 0;\n  margin: -1px;\n  overflow: hidden;\n  clip: rect(0, 0, 0, 0);\n  white-space: nowrap;\n  border: 0;\n}'
    }
  },
  'input-image-alt': {
    wcag_id: '1.1.1',
    criterion: 'Non-text Content',
    level: 'A',
    category: 'Perceivable',
    impact: 'Screen reader users cannot identify image button purpose.',
    fix: 'Add alt attribute to input type="image" describing the button action.',
    code_example: {
      bad: '<input type="image" src="search.png">',
      good: '<input type="image" src="search.png" alt="Search">'
    }
  },
  'object-alt': {
    wcag_id: '1.1.1',
    criterion: 'Non-text Content',
    level: 'A',
    category: 'Perceivable',
    impact: 'Screen reader users cannot identify embedded object content.',
    fix: 'Add text alternatives or accessible fallback content for objects.',
    code_example: {
      bad: '<object data="report.pdf"></object>',
      good: '<object data="report.pdf" aria-label="Annual Report PDF">\n  <a href="report.pdf">Download Annual Report</a>\n</object>'
    }
  },
  'role-img-alt': {
    wcag_id: '1.1.1',
    criterion: 'Non-text Content',
    level: 'A',
    category: 'Perceivable',
    impact: 'Screen reader users cannot identify image purpose when role="img" lacks accessible name.',
    fix: 'Add aria-label or aria-labelledby to elements with role="img".',
    code_example: {
      bad: '<div role="img" style="background-image: url(icon.png)"></div>',
      good: '<div role="img" aria-label="Settings" style="background-image: url(icon.png)"></div>'
    }
  },
  'scrollable-region-focusable': {
    wcag_id: '2.1.1',
    criterion: 'Keyboard',
    level: 'A',
    category: 'Operable',
    impact: 'Keyboard users cannot scroll overflow content without a mouse.',
    fix: 'Ensure scrollable regions can receive focus via tabindex or contain focusable elements.',
    code_example: {
      bad: '<div style="overflow: auto; height: 200px;">Long content...</div>',
      good: '<div tabindex="0" role="region" aria-label="Terms and conditions" style="overflow: auto; height: 200px;">Long content...</div>'
    }
  },
  'video-caption': {
    wcag_id: '1.2.2',
    criterion: 'Captions (Prerecorded)',
    level: 'A',
    category: 'Perceivable',
    impact: 'Deaf or hard-of-hearing users cannot access video audio content.',
    fix: 'Provide synchronized captions for all prerecorded video content.',
    code_example: {
      bad: '<video src="tutorial.mp4" controls></video>',
      good: '<video src="tutorial.mp4" controls>\n  <track kind="captions" src="tutorial-captions.vtt" srclang="en" label="English">\n</video>'
    }
  },
  'video-description': {
    wcag_id: '1.2.3',
    criterion: 'Audio Description or Media Alternative (Prerecorded)',
    level: 'A',
    category: 'Perceivable',
    impact: 'Blind users cannot access visual information in videos.',
    fix: 'Provide audio descriptions or full text transcript of visual content.',
    code_example: {
      bad: '<video src="demo.mp4" controls></video>',
      good: '<video src="demo.mp4" controls>\n  <track kind="descriptions" src="demo-desc.vtt" srclang="en">\n</video>'
    }
  },
  'autocomplete-appropriate': {
    wcag_id: '1.3.5',
    criterion: 'Identify Input Purpose',
    level: 'AA',
    category: 'Perceivable',
    impact: 'Users with cognitive disabilities must re-enter information. Users with motor disabilities must type instead of use autofill.',
    fix: 'Use appropriate autocomplete token values for the input purpose.',
    code_example: {
      bad: '<input type="text" name="email" autocomplete="username">',
      good: '<input type="email" name="email" autocomplete="email">'
    }
  },
  'input-button-name': {
    wcag_id: '4.1.2',
    criterion: 'Name, Role, Value',
    level: 'A',
    category: 'Robust',
    impact: 'Screen reader users cannot identify image input button purpose.',
    fix: 'Add alt attribute to input type="image" or value to input type="submit/reset".',
    code_example: {
      bad: '<input type="submit">',
      good: '<input type="submit" value="Send Message">'
    }
  },
  'nested-interactive': {
    wcag_id: '4.1.2',
    criterion: 'Name, Role, Value',
    level: 'A',
    category: 'Robust',
    impact: 'Nested interactive elements confuse screen readers and break keyboard navigation.',
    fix: 'Do not nest interactive elements (buttons, links, inputs) inside each other.',
    code_example: {
      bad: '<a href="/">\n  <button>Click</button>\n</a>',
      good: '<a href="/">Link</a>\n<button>Click</button>'
    }
  },
  'no-autoplay-audio': {
    wcag_id: '1.4.2',
    criterion: 'Audio Control',
    level: 'A',
    category: 'Perceivable',
    impact: 'Autoplay audio interferes with screen reader output, making navigation impossible.',
    fix: 'Provide controls to stop, pause, or adjust volume of auto-playing audio.',
    code_example: {
      bad: '<audio src="background.mp3" autoplay></audio>',
      good: '<audio src="content.mp3" controls></audio>'
    }
  },
  'scope-attr-valid': {
    wcag_id: '1.3.1',
    criterion: 'Info and Relationships',
    level: 'A',
    category: 'Perceivable',
    impact: 'Invalid scope attributes cause screen readers to announce incorrect header associations.',
    fix: 'Use valid scope values: row, col, rowgroup, or colgroup.',
    code_example: {
      bad: '<th scope="horizontal">Header</th>',
      good: '<th scope="col">Header</th>'
    }
  },
  'server-side-image-map': {
    wcag_id: '2.1.1',
    criterion: 'Keyboard',
    level: 'A',
    category: 'Operable',
    impact: 'Server-side image maps cannot be operated with keyboard.',
    fix: 'Replace server-side image maps with client-side image maps or alternative navigation.',
    code_example: {
      bad: '<img src="map" ismap>',
      good: '<img src="map" usemap="#navmap">\n<map name="navmap">\n  <area shape="rect" coords="0,0,50,50" href="/" alt="Home">\n</map>'
    }
  },
  'aria-errormessage': {
    wcag_id: '3.3.1',
    criterion: 'Error Identification',
    level: 'A',
    category: 'Understandable',
    impact: 'Error messages not associated with inputs cannot be announced by screen readers.',
    fix: 'Use aria-errormessage to associate error messages with form controls.',
    code_example: {
      bad: '<input aria-invalid="true">\n<span class="error">Invalid email</span>',
      good: '<input aria-invalid="true" aria-errormessage="email-error">\n<span id="email-error">Invalid email</span>'
    }
  },
  'aria-level': {
    wcag_id: '1.3.1',
    criterion: 'Info and Relationships',
    level: 'A',
    category: 'Perceivable',
    impact: 'Invalid heading levels in ARIA roles disrupt document outline.',
    fix: 'Use aria-level with valid positive integers for heading roles.',
    code_example: {
      bad: '<div role="heading" aria-level="0">Title</div>',
      good: '<div role="heading" aria-level="1">Title</div>'
    }
  },
  'dlitem': {
    wcag_id: '1.3.1',
    criterion: 'Info and Relationships',
    level: 'A',
    category: 'Perceivable',
    impact: 'Definition list items outside proper structure confuse screen readers.',
    fix: 'Ensure dt and dd elements are direct children of dl.',
    code_example: {
      bad: '<div><dt>Term</dt><dd>Definition</dd></div>',
      good: '<dl>\n  <dt>Term</dt>\n  <dd>Definition</dd>\n</dl>'
    }
  },
  'duplicate-id': {
    wcag_id: '4.1.1',
    criterion: 'Parsing',
    level: 'A',
    category: 'Robust',
    impact: 'Duplicate IDs break aria-labelledby associations and form label associations.',
    fix: 'Ensure all id attributes are unique within the page.',
    code_example: {
      bad: '<div id="section">...</div>\n<div id="section">...</div>',
      good: '<div id="section1">...</div>\n<div id="section2">...</div>'
    }
  },
  'duplicate-id-active': {
    wcag_id: '4.1.1',
    criterion: 'Parsing',
    level: 'A',
    category: 'Robust',
    impact: 'Duplicate active element IDs break label associations and focus management.',
    fix: 'Ensure all active element IDs are unique within the page.',
    code_example: {
      bad: '<button id="submit">Submit</button>\n<button id="submit">Send</button>',
      good: '<button id="submit-form">Submit</button>\n<button id="submit-contact">Send</button>'
    }
  },
  'duplicate-id-aria': {
    wcag_id: '4.1.1',
    criterion: 'Parsing',
    level: 'A',
    category: 'Robust',
    impact: 'Duplicate IDs referenced by ARIA break accessible name calculations.',
    fix: 'Ensure all IDs referenced by aria-labelledby or aria-describedby are unique.',
    code_example: {
      bad: '<span id="name">First</span>\n<span id="name">Last</span>\n<input aria-labelledby="name">',
      good: '<span id="fname-label">First</span>\n<span id="lname-label">Last</span>\n<input aria-labelledby="fname-label">'
    }
  },
  'focus-order-semantics': {
    wcag_id: '2.4.3',
    criterion: 'Focus Order',
    level: 'A',
    category: 'Operable',
    impact: 'Elements with tabIndex > 0 create illogical tab order, confusing keyboard users.',
    fix: 'Remove positive tabIndex values. Rely on natural DOM order for focus sequence.',
    code_example: {
      bad: '<div tabIndex="3">Third</div>\n<div tabIndex="1">First</div>',
      good: '<div>First</div>\n<div>Second</div>\n<div tabIndex="0">Custom focusable</div>'
    }
  },
  'frame-title-unique': {
    wcag_id: '2.4.1',
    criterion: 'Bypass Blocks',
    level: 'A',
    category: 'Operable',
    impact: 'Multiple iframes with same title are indistinguishable to screen reader users.',
    fix: 'Provide unique, descriptive titles for each iframe.',
    code_example: {
      bad: '<iframe title="Form" src="contact.html"></iframe>\n<iframe title="Form" src="feedback.html"></iframe>',
      good: '<iframe title="Contact Form" src="contact.html"></iframe>\n<iframe title="Feedback Form" src="feedback.html"></iframe>'
    }
  },
  'heading-unique': {
    wcag_id: '1.3.1',
    criterion: 'Info and Relationships',
    level: 'A',
    category: 'Perceivable',
    impact: 'Duplicate heading text makes navigation by headings confusing.',
    fix: 'Make headings unique or add context to distinguish similar sections.',
    code_example: {
      bad: '<h2>Products</h2>...<h2>Products</h2>',
      good: '<h2>Featured Products</h2>...<h2>All Products</h2>'
    }
  },
  'landmark-complementary-is-top-level': {
    wcag_id: '1.3.1',
    criterion: 'Info and Relationships',
    level: 'A',
    category: 'Perceivable',
    impact: 'Nested complementary landmarks confuse page structure for screen readers.',
    fix: 'Ensure aside elements are top-level, not nested in other landmarks.',
    code_example: {
      bad: '<main>\n  <aside>...</aside>\n</main>',
      good: '<aside>...</aside>\n<main>...</main>'
    }
  },
  'landmark-main-only-one': {
    wcag_id: '1.3.1',
    criterion: 'Info and Relationships',
    level: 'A',
    category: 'Perceivable',
    impact: 'Multiple main landmarks without labels confuse navigation.',
    fix: 'Use only one main landmark per page.',
    code_example: {
      bad: '<main>...</main>\n<main>...</main>',
      good: '<main id="content">...</main>'
    }
  },
  'region-role': {
    wcag_id: '1.3.1',
    criterion: 'Info and Relationships',
    level: 'A',
    category: 'Perceivable',
    impact: 'Generic regions without labels provide no navigation value.',
    fix: 'Add aria-label to generic regions or use more specific landmark roles.',
    code_example: {
      bad: '<div role="region">...</div>',
      good: '<section aria-label="Featured Articles">...</section>'
    }
  },
  'svg-img-alt': {
    wcag_id: '1.1.1',
    criterion: 'Non-text Content',
    level: 'A',
    category: 'Perceivable',
    impact: 'Screen readers cannot identify SVG image purpose.',
    fix: 'Add role="img" and aria-label or title to informative SVGs.',
    code_example: {
      bad: '<svg viewBox="0 0 100 100">...</svg>',
      good: '<svg role="img" aria-label="Company logo" viewBox="0 0 100 100">...</svg>'
    }
  },
  'table-fake-caption': {
    wcag_id: '1.3.1',
    criterion: 'Info and Relationships',
    criterion: 'Info and Relationships',
    level: 'A',
    category: 'Perceivable',
    impact: 'Fake captions using regular cells are not announced as table captions.',
    fix: 'Use actual caption element as first child of table.',
    code_example: {
      bad: '<table>\n  <tr><td colspan="3">Sales Data</td></tr>\n  ...\n</table>',
      good: '<table>\n  <caption>Sales Data</caption>\n  ...\n</table>'
    }
  },
  'table-contains-thead-tbody': {
    wcag_id: '1.3.1',
    criterion: 'Info and Relationships',
    level: 'A',
    category: 'Perceivable',
    impact: 'Tables without thead/tbody structure may not convey header relationships correctly.',
    fix: 'Use thead for header rows and tbody for data rows.',
    code_example: {
      bad: '<table>\n  <tr><th>Header</th></tr>\n  <tr><td>Data</td></tr>\n</table>',
      good: '<table>\n  <thead>\n    <tr><th>Header</th></tr>\n  </thead>\n  <tbody>\n    <tr><td>Data</td></tr>\n  </tbody>\n</table>'
    }
  },
  'label-title-only': {
    wcag_id: '2.4.6',
    criterion: 'Headings and Labels',
    level: 'AA',
    category: 'Understandable',
    impact: 'Title attribute alone is not consistently available to assistive technology.',
    fix: 'Use visible label or aria-label/aria-labelledby, not just title.',
    code_example: {
      bad: '<input title="Email address">',
      good: '<label for="email">Email address</label>\n<input id="email">'
    }
  },
  'href-no-hash': {
    wcag_id: '2.4.4',
    criterion: 'Link Purpose (In Context)',
    level: 'A',
    category: 'Operable',
    impact: 'Links with href="#" create confusing navigation and break keyboard functionality.',
    fix: 'Use proper href targets or button elements for JavaScript actions.',
    code_example: {
      bad: '<a href="#" onclick="submit()">Submit</a>',
      good: '<button type="button" onclick="submit()">Submit</button>\n<!-- or -->\n<a href="/submit">Submit</a>'
    }
  },
  'html-xml-lang-mismatch': {
    wcag_id: '3.1.1',
    criterion: 'Language of Page',
    level: 'A',
    category: 'Understandable',
    impact: 'Conflicting language declarations confuse screen readers.',
    fix: 'Ensure html lang and xml:lang attributes match.',
    code_example: {
      bad: '<html lang="en" xml:lang="fr">',
      good: '<html lang="en" xml:lang="en">'
    }
  },
  'aria-valid-attr': {
    wcag_id: '4.1.1',
    criterion: 'Parsing',
    level: 'A',
    category: 'Robust',
    impact: 'Invalid ARIA attributes are ignored by assistive technology.',
    fix: 'Use only valid ARIA attributes defined in the specification.',
    code_example: {
      bad: '<div aria-invalid-attribute="true">',
      good: '<div aria-hidden="true">'
    }
  },
  'aria-braille-equivalent': {
    wcag_id: '4.1.2',
    criterion: 'Name, Role, Value',
    level: 'A',
    category: 'Robust',
    impact: 'Missing braille content prevents refreshable braille display users from accessing information.',
    fix: 'Provide aria-braillelabel or aria-brailleroledescription when appropriate.',
    code_example: {
      bad: '<span aria-label="5 stars">★★★★★</span>',
      good: '<span aria-label="5 stars" aria-braillelabel="5 of 5 stars">★★★★★</span>'
    }
  },
  'aria-conditional-attr': {
    wcag_id: '4.1.2',
    criterion: 'Name, Role, Value',
    level: 'A',
    category: 'Robust',
    impact: 'Missing required conditional attributes break ARIA widget functionality.',
    fix: 'Include all required attributes based on ARIA role and state.',
    code_example: {
      bad: '<div role="checkbox" aria-checked="true">',
      good: '<div role="checkbox" aria-checked="true" tabindex="0" aria-label="Subscribe">'
    }
  },
  'aria-deprecated-role': {
    wcag_id: '4.1.2',
    criterion: 'Name, Role, Value',
    level: 'A',
    category: 'Robust',
    impact: 'Deprecated ARIA roles may not be supported by assistive technology.',
    fix: 'Replace deprecated roles with current equivalents.',
    code_example: {
      bad: '<div role="directory">',
      good: '<ul>\n  <li><a href="/">Home</a></li>\n</ul>'
    }
  },
  'aria-prohibited-attr': {
    wcag_id: '4.1.2',
    criterion: 'Name, Role, Value',
    level: 'A',
    category: 'Robust',
    impact: 'Prohibited ARIA attributes create conflicting or ignored information.',
    fix: 'Remove prohibited attributes from elements that don\'t support them.',
    code_example: {
      bad: '<input type="text" aria-label="Name" placeholder="Enter name">',
      good: '<label for="name">Name</label>\n<input type="text" id="name" placeholder="Enter name">'
    }
  },
  'aria-text': {
    wcag_id: '4.1.2',
    criterion: 'Name, Role, Value',
    level: 'A',
    category: 'Robust',
    impact: 'Elements with text role may override semantic meaning.',
    fix: 'Avoid role="text" unless specifically needed to flatten element semantics.',
    code_example: {
      bad: '<h1 role="text">Heading</h1>',
      good: '<h1>Heading</h1>'
    }
  },
  'aria-treeitem-level': {
    wcag_id: '4.1.2',
    criterion: 'Name, Role, Value',
    level: 'A',
    category: 'Robust',
    impact: 'Tree items without proper level information confuse hierarchical navigation.',
    fix: 'Include aria-level on treeitem elements to indicate depth.',
    code_example: {
      bad: '<li role="treeitem">Parent</li>',
      good: '<li role="treeitem" aria-level="1" aria-expanded="true">Parent</li>'
    }
  },
  'audio-caption': {
    wcag_id: '1.2.2',
    criterion: 'Captions (Prerecorded)',
    level: 'A',
    category: 'Perceivable',
    impact: 'Deaf or hard-of-hearing users cannot access audio content.',
    fix: 'Provide captions or transcript for audio content.',
    code_example: {
      bad: '<audio src="podcast.mp3" controls></audio>',
      good: '<figure>\n  <audio src="podcast.mp3" controls></audio>\n  <figcaption><a href="transcript.html">Read transcript</a></figcaption>\n</figure>'
    }
  },
  'avoid-inline-spacing': {
    wcag_id: '1.4.12',
    criterion: 'Text Spacing',
    level: 'AA',
    category: 'Perceivable',
    impact: 'Fixed inline spacing prevents users from adjusting text spacing for readability.',
    fix: 'Use relative units (em, rem) instead of px for letter-spacing, word-spacing, and line-height.',
    code_example: {
      bad: 'p { letter-spacing: 2px; line-height: 20px; }',
      good: 'p { letter-spacing: 0.12em; line-height: 1.5; }'
    }
  },
  'button-has-visible-content': {
    wcag_id: '4.1.2',
    criterion: 'Name, Role, Value',
    level: 'A',
    category: 'Robust',
    impact: 'Buttons without visible text rely solely on icons or ARIA, which may not be understood by all users.',
    fix: 'Include visible text content or ensure accessible name is visible.',
    code_example: {
      bad: '<button aria-label="Close"></button>',
      good: '<button aria-label="Close dialog">\n  <span aria-hidden="true">&times;</span>\n  <span class="visually-hidden">Close</span>\n</button>'
    }
  },
  'frame-focusable-content': {
    wcag_id: '2.1.1',
    criterion: 'Keyboard',
    level: 'A',
    category: 'Operable',
    impact: 'Focusable content inside non-focusable frames may be unreachable by keyboard.',
    fix: 'Ensure frames can receive focus or contain proper focus management.',
    code_example: {
      bad: '<iframe src="form.html" tabindex="-1"></iframe>',
      good: '<iframe src="form.html" title="Contact Form"></iframe>'
    }
  },
  'html-lang-valid': {
    wcag_id: '3.1.1',
    criterion: 'Language of Page',
    level: 'A',
    category: 'Understandable',
    impact: 'Invalid language codes cause incorrect pronunciation.',
    fix: 'Use valid BCP 47 language codes.',
    code_example: {
      bad: '<html lang="en-US">',
      good: '<html lang="en">'
    }
  },
  'input-autocomplete': {
    wcag_id: '1.3.5',
    criterion: 'Identify Input Purpose',
    level: 'AA',
    category: 'Perceivable',
    impact: 'Without autocomplete, users with cognitive or motor disabilities must re-enter information.',
    fix: 'Add appropriate autocomplete attribute to form inputs.',
    code_example: {
      bad: '<input type="text" name="fname">',
      good: '<input type="text" name="fname" autocomplete="given-name">'
    }
  },
  'line-height': {
    wcag_id: '1.4.8',
    criterion: 'Visual Presentation',
    level: 'AAA',
    category: 'Perceivable',
    impact: 'Insufficient line height reduces readability, especially for users with dyslexia.',
    fix: 'Set line-height to at least 1.5 (150%).',
    code_example: {
      bad: 'p { line-height: 1.2; }',
      good: 'p { line-height: 1.5; }'
    }
  },
  'link-name': {
    wcag_id: '2.4.4',
    criterion: 'Link Purpose (In Context)',
    level: 'A',
    category: 'Operable',
    impact: 'Screen reader users cannot determine where links lead without meaningful text.',
    fix: 'Ensure links have descriptive text that makes sense out of context.',
    code_example: {
      bad: '<a href="/about">Click here</a>',
      good: '<a href="/about">About Our Company</a>'
    }
  },
  'menuitem-role': {
    wcag_id: '4.1.2',
    criterion: 'Name, Role, Value',
    level: 'A',
    category: 'Robust',
    impact: 'Menu items without proper roles break navigation patterns.',
    fix: 'Ensure menuitem elements are inside proper menu containers with correct roles.',
    code_example: {
      bad: '<div>\n  <span role="menuitem">File</span>\n</div>',
      good: '<ul role="menubar">\n  <li role="none">\n    <span role="menuitem" aria-haspopup="true">File</span>\n  </li>\n</ul>'
    }
  },
  'meta-viewport-large': {
    wcag_id: '1.4.4',
    criterion: 'Resize Text',
    level: 'AA',
    category: 'Perceivable',
    impact: 'Restricting zoom prevents users from enlarging text for readability.',
    fix: 'Allow zoom by setting maximum-scale=2.0 or higher, or remove user-scalable restriction.',
    code_example: {
      bad: '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">',
      good: '<meta name="viewport" content="width=device-width, initial-scale=1">'
    }
  },
  'presentation-role-conflict': {
    wcag_id: '1.3.1',
    criterion: 'Info and Relationships',
    level: 'A',
    category: 'Perceivable',
    impact: 'role="presentation" on focusable elements creates confusing announcements.',
    fix: 'Remove role="presentation" from focusable elements or make them non-focusable.',
    code_example: {
      bad: '<button role="presentation">Click</button>',
      good: '<button>Click</button>'
    }
  },
  'select-name-value': {
    wcag_id: '4.1.2',
    criterion: 'Name, Role, Value',
    level: 'A',
    category: 'Robust',
    impact: 'Select elements without proper names or values cannot be understood by screen readers.',
    fix: 'Associate label with select and ensure options have meaningful values.',
    code_example: {
      bad: '<select>\n  <option value="1">Option 1</option>\n</select>',
      good: '<label for="country">Country</label>\n<select id="country">\n  <option value="us">United States</option>\n</select>'
    }
  },
  'skip-link-target-exists': {
    wcag_id: '2.4.1',
    criterion: 'Bypass Blocks',
    level: 'A',
    category: 'Operable',
    impact: 'Skip links that don\'t point to existing targets fail to help keyboard users.',
    fix: 'Ensure skip link href matches an existing element ID.',
    code_example: {
      bad: '<a href="#main">Skip to main</a>\n<!-- No element with id="main" -->',
      good: '<a href="#main-content">Skip to main</a>\n<main id="main-content">...</main>'
    }
  },
  'tabular-structure': {
    wcag_id: '1.3.1',
    criterion: 'Info and Relationships',
    level: 'A',
    category: 'Perceivable',
    impact: 'Tables used for layout break screen reader navigation and reading order.',
    fix: 'Use CSS for layout. Only use tables for tabular data.',
    code_example: {
      bad: '<table>\n  <tr>\n    <td>Navigation</td>\n    <td>Main Content</td>\n  </tr>\n</table>',
      good: '<nav>...</nav>\n<main>...</main>'
    }
  },
  'unsupported-role': {
    wcag_id: '4.1.2',
    criterion: 'Name, Role, Value',
    level: 'A',
    category: 'Robust',
    impact: 'Unsupported ARIA roles may not be recognized by assistive technology.',
    fix: 'Use only standardized ARIA roles with good support.',
    code_example: {
      bad: '<div role="unsupported-widget">',
      good: '<div role="button" tabindex="0">Button</div>'
    }
  },
  'video-audio-description': {
    wcag_id: '1.2.5',
    criterion: 'Audio Description (Prerecorded)',
    level: 'AA',
    category: 'Perceivable',
    impact: 'Blind users cannot access important visual information in videos.',
    fix: 'Provide audio descriptions for important visual content.',
    code_example: {
      bad: '<video src="demo.mp4" controls></video>',
      good: '<video src="demo.mp4" controls>\n  <track kind="descriptions" src="descriptions.vtt">\n</video>'
    }
  }
};

/**
 * Get WCAG rule details by rule ID
 */
export function getWcagRule(ruleId) {
  return WCAG_RULES[ruleId] || {
    wcag_id: '2.1',
    criterion: 'General Accessibility',
    level: 'AA',
    category: 'General',
    impact: 'This issue affects users with disabilities.',
    fix: 'Review and fix according to best practices.',
    code_example: null
  };
}

/**
 * Get all WCAG rule IDs
 */
export function getAllWcagRuleIds() {
  return Object.keys(WCAG_RULES);
}

/**
 * Get rules by WCAG level
 */
export function getRulesByLevel(level) {
  return Object.entries(WCAG_RULES)
    .filter(([_, rule]) => rule.level === level)
    .map(([id, rule]) => ({ id, ...rule }));
}

/**
 * Get rules by category
 */
export function getRulesByCategory(category) {
  return Object.entries(WCAG_RULES)
    .filter(([_, rule]) => rule.category === category)
    .map(([id, rule]) => ({ id, ...rule }));
}

export default WCAG_RULES;
