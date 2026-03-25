/**
 * Shared accessibility utility functions for WCAG mapping and level handling
 */

/**
 * Maps axe-core rule IDs to WCAG Levels
 */
export function mapToWCAGLevel(ruleId) {
  const mapping = {
    'color-contrast': 'AA',
    'image-alt': 'A',
    'label': 'A',
    'link-name': 'A',
    'button-name': 'A',
    'aria-roles': 'A',
    'aria-allowed-attr': 'A',
    'aria-allowed-role': 'A',
    'aria-deprecated-role': 'A',
    'aria-hidden-body': 'A',
    'aria-hidden-focus': 'A',
    'aria-input-field-name': 'A',
    'aria-required-attr': 'A',
    'aria-required-children': 'A',
    'aria-required-parent': 'A',
    'aria-toggle-field-name': 'A',
    'aria-valid-attr-value': 'A',
    'aria-valid-attr': 'A',
    'color-contrast': 'AA',
    'image-alt': 'A',
    'label': 'A',
    'link-name': 'A',
    'button-name': 'A',
    'auth-input-label': 'A',
    'auth-placeholder-only': 'AA',
    'auth-autocomplete-email': 'AA',
    'auth-autocomplete-password': 'AA',
    'auth-required-indication': 'A',
    'auth-error-association': 'A',
    'auth-color-only-error': 'A',
    'auth-keyboard-navigation': 'A',
    'auth-submit-button-label': 'A',
    'auth-captcha-alternative': 'AA'
  };
  return mapping[ruleId] || 'AA';
}

/**
 * Extract WCAG success criteria from axe-core tags and generate official URLs.
 */
export function extractWcagTags(tags) {
  // Map WCAG SC numbers to their URL slugs on w3.org
  const scToSlug = {
    '111': 'non-text-content',
    '121': 'audio-only-and-video-only-prerecorded',
    '122': 'captions-prerecorded',
    '123': 'audio-description-or-media-alternative-prerecorded',
    '131': 'info-and-relationships',
    '132': 'meaningful-sequence',
    '133': 'sensory-characteristics',
    '134': 'orientation',
    '135': 'identify-input-purpose',
    '141': 'use-of-color',
    '142': 'audio-control',
    '143': 'contrast-minimum',
    '144': 'resize-text',
    '145': 'images-of-text',
    '1410': 'reflow',
    '1411': 'non-text-contrast',
    '1412': 'text-spacing',
    '1413': 'content-on-hover-or-focus',
    '211': 'keyboard',
    '212': 'no-keyboard-trap',
    '214': 'character-key-shortcuts',
    '221': 'timing-adjustable',
    '222': 'pause-stop-hide',
    '231': 'three-flashes-or-below-threshold',
    '241': 'bypass-blocks',
    '242': 'page-titled',
    '243': 'focus-order',
    '244': 'link-purpose-in-context',
    '245': 'multiple-ways',
    '246': 'headings-and-labels',
    '247': 'focus-visible',
    '251': 'pointer-gestures',
    '252': 'pointer-cancellation',
    '253': 'label-in-name',
    '254': 'motion-actuation',
    '311': 'language-of-page',
    '312': 'language-of-parts',
    '321': 'on-focus',
    '322': 'on-input',
    '323': 'consistent-navigation',
    '324': 'consistent-identification',
    '331': 'error-identification',
    '332': 'labels-or-instructions',
    '333': 'error-suggestion',
    '334': 'error-prevention-legal-financial-data',
    '411': 'parsing',
    '412': 'name-role-value',
    '413': 'status-messages',
  };

  const results = [];
  if (!tags || !Array.isArray(tags)) return results;
  
  for (const tag of tags) {
    const scMatch = tag.match(/^wcag(\d{3,4})$/);
    if (scMatch) {
      const scNum = scMatch[1];
      const formatted = scNum.length === 3 
        ? `${scNum[0]}.${scNum[1]}.${scNum[2]}`
        : `${scNum[0]}.${scNum[1]}.${scNum[2]}${scNum[3]}`;
      
      const slug = scToSlug[scNum] || scToSlug[scNum.substring(0, 3)] || null;
      const url = slug 
        ? `https://www.w3.org/WAI/WCAG22/Understanding/${slug}.html`
        : `https://www.w3.org/WAI/WCAG22/quickref/#${formatted.replace(/\./g, '')}`;
      
      results.push({
        criterion: formatted,
        label: `WCAG ${formatted}`,
        url: url
      });
    }
  }

  return results;
}
