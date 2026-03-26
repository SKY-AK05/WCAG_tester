/**
 * AI Enrichment Service - Batched AI processing for accessibility issues
 * Efficiently enriches multiple issues with AI-generated explanations and fixes
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

class AIEnrichmentService {
  constructor(apiKey) {
    this.genAI = new GoogleGenerativeAI(apiKey || process.env.GEMINI_API_KEY || "AI_KEY_NOT_FOUND");
    this.modelsToTry = [
      "gemini-2.0-flash",
      "gemini-2.0-flash-lite",
      "gemini-1.5-flash",
      "gemini-pro"
    ];
    this.batchSize = 5; // Number of issues per API call
    this.cache = new Map(); // Cache for repeated rules
  }

  /**
   * Check if API key is valid
   */
  isAvailable() {
    const key = process.env.GEMINI_API_KEY;
    return key && key !== 'YOUR_GEMINI_API_KEY_HERE' && key.length > 10;
  }

  /**
   * Enrich multiple issues with AI-generated content
   * Uses batching to minimize API calls
   * @param {Array} issues - Array of normalized issues
   * @param {Object} options - Processing options
   * @returns {Array} Issues with AI enrichment
   */
  async enrichIssues(issues, options = {}) {
    if (!this.isAvailable()) {
      console.log('[AI] No valid API key, skipping AI enrichment');
      return issues.map(i => ({
        ...i,
        ai_explanation: 'AI enrichment requires a valid API key.',
        ai_fix: i.fix || 'Review WCAG guidelines for fix.',
        ai_best_practice: 'Follow semantic HTML and ARIA best practices.',
        ai_enriched: false
      }));
    }

    const { 
      batchSize = this.batchSize, 
      onlyFailures = true,
      onProgress = null 
    } = options;

    // Filter to only failures if requested
    const issuesToEnrich = onlyFailures 
      ? issues.filter(i => i.status === 'fail')
      : issues;

    // Skip if no issues to process
    if (issuesToEnrich.length === 0) {
      return issues;
    }

    console.log(`[AI] Enriching ${issuesToEnrich.length} issues in batches of ${batchSize}...`);

    // Create batches
    const batches = this.createBatches(issuesToEnrich, batchSize);
    const enrichedData = new Map();

    // Process batches
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`[AI] Processing batch ${i + 1}/${batches.length} (${batch.length} issues)`);

      try {
        const batchResults = await this.processBatch(batch);
        
        // Store results
        batch.forEach((issue, index) => {
          enrichedData.set(issue.rule_id, batchResults[index]);
        });

        // Report progress
        if (onProgress) {
          onProgress({
            current: Math.min((i + 1) * batchSize, issuesToEnrich.length),
            total: issuesToEnrich.length,
            percentage: Math.round(((i + 1) / batches.length) * 100)
          });
        }

        // Small delay between batches to avoid rate limits
        if (i < batches.length - 1) {
          await this.delay(500);
        }
      } catch (error) {
        console.error(`[AI] Batch ${i + 1} failed:`, error.message);
        
        // Mark batch as failed but continue
        batch.forEach(issue => {
          enrichedData.set(issue.rule_id, {
            ai_explanation: 'AI enrichment failed for this issue.',
            ai_fix: issue.fix || 'Review WCAG guidelines.',
            ai_best_practice: 'Follow semantic HTML best practices.',
            ai_enriched: false
          });
        });
      }
    }

    // Merge enriched data back into original issues
    return issues.map(issue => {
      const enriched = enrichedData.get(issue.rule_id);
      if (enriched && issue.status === 'fail') {
        return { ...issue, ...enriched };
      }
      return issue;
    });
  }

  /**
   * Create batches from issues array
   */
  createBatches(issues, batchSize) {
    const batches = [];
    for (let i = 0; i < issues.length; i += batchSize) {
      batches.push(issues.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Process a batch of issues with single API call
   */
  async processBatch(batch) {
    // Check cache first
    const results = batch.map(issue => {
      const cached = this.cache.get(issue.rule_id);
      return cached ? { issue, cached: true } : { issue, cached: false };
    });

    const uncachedIssues = results.filter(r => !r.cached).map(r => r.issue);
    
    if (uncachedIssues.length === 0) {
      // All cached
      return batch.map(issue => this.cache.get(issue.rule_id));
    }

    // Build prompt for batch
    const prompt = this.buildBatchPrompt(uncachedIssues);

    // Try models in order
    let lastError = null;
    for (const modelName of this.modelsToTry) {
      try {
        const model = this.genAI.getGenerativeModel({ 
          model: modelName,
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 2048
          }
        });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = await response.text();

        // Parse the response
        const parsedResults = this.parseBatchResponse(text, uncachedIssues);

        // Cache results
        uncachedIssues.forEach((issue, index) => {
          this.cache.set(issue.rule_id, parsedResults[index]);
        });

        // Return full results including cached ones
        return batch.map(issue => this.cache.get(issue.rule_id));

      } catch (err) {
        lastError = err;
        if (err.status === 404 || err.status === 429) {
          console.warn(`[AI] Model ${modelName} failed, trying fallback...`);
          continue;
        }
        throw err;
      }
    }

    throw lastError || new Error('All AI models failed');
  }

  /**
   * Build optimized prompt for batch processing
   */
  buildBatchPrompt(issues) {
    const issuesList = issues.map((issue, index) => `
ISSUE ${index + 1}:
- Rule: ${issue.rule_id}
- Title: ${issue.title}
- WCAG: ${issue.wcag_id} (Level ${issue.level})
- Current Impact: ${issue.impact}
- Current Fix: ${issue.fix}
- Affected HTML: ${issue.elements[0]?.html?.substring(0, 200) || 'N/A'}
`).join('\n---\n');

    return `
You are an expert Web Accessibility Auditor specializing in WCAG 2.2 compliance.

For each of the following accessibility issues, provide:
1. **explanation**: A clear explanation of why this is an accessibility problem and who it affects (2-3 sentences)
2. **fix**: Specific, actionable code-level fix instructions
3. **best_practice**: One-line best practice to prevent this issue

Format your response as valid JSON array with objects containing: rule_id, explanation, fix, best_practice

${issuesList}

IMPORTANT: Return ONLY a valid JSON array like this:
[
  {
    "rule_id": "issue-identifier",
    "explanation": "Clear explanation...",
    "fix": "Specific fix instructions...",
    "best_practice": "One-line best practice"
  }
]

No markdown formatting, no code blocks, no additional text. Just the JSON array.
`;
  }

  /**
   * Parse batch response from AI
   */
  parseBatchResponse(text, issues) {
    try {
      // Clean up the response - remove markdown code blocks if present
      let cleanText = text
        .replace(/```json\s*/g, '')
        .replace(/```\s*$/g, '')
        .replace(/^```\s*/g, '')
        .trim();

      // Try to parse as JSON
      const parsed = JSON.parse(cleanText);
      
      if (Array.isArray(parsed)) {
        // Map back to issue order
        return issues.map(issue => {
          const match = parsed.find(p => p.rule_id === issue.rule_id);
          return match ? {
            ai_explanation: match.explanation || match.ai_explanation || 'No explanation available.',
            ai_fix: match.fix || match.ai_fix || issue.fix,
            ai_best_practice: match.best_practice || match.ai_best_practice || 'Follow WCAG best practices.',
            ai_enriched: true
          } : this.getDefaultEnrichment(issue);
        });
      }

      // If not array, try to extract from object
      return issues.map(issue => ({
        ai_explanation: parsed.explanation || 'No explanation available.',
        ai_fix: parsed.fix || issue.fix,
        ai_best_practice: parsed.best_practice || 'Follow WCAG best practices.',
        ai_enriched: true
      }));

    } catch (error) {
      console.error('[AI] Failed to parse batch response:', error.message);
      console.log('[AI] Raw response:', text.substring(0, 500));
      
      // Return defaults
      return issues.map(issue => this.getDefaultEnrichment(issue));
    }
  }

  /**
   * Get default enrichment for failed AI calls
   */
  getDefaultEnrichment(issue) {
    return {
      ai_explanation: issue.impact || 'This issue affects users with disabilities.',
      ai_fix: issue.fix || 'Review WCAG guidelines for the appropriate fix.',
      ai_best_practice: 'Use semantic HTML and follow WCAG 2.2 guidelines.',
      ai_enriched: false
    };
  }

  /**
   * Enrich a single issue on-demand
   * Used when user clicks "Get AI Fix" for specific issue
   */
  async enrichSingleIssue(issue) {
    if (!this.isAvailable()) {
      return {
        ...issue,
        ai_explanation: 'AI enrichment requires a valid API key.',
        ai_enriched: false
      };
    }

    // Check cache
    const cached = this.cache.get(issue.rule_id);
    if (cached) {
      return { ...issue, ...cached };
    }

    const prompt = `
You are an expert Web Accessibility Auditor (WCAG 2.2 Specialist).

Analyze this specific accessibility issue and provide:

**Issue**: ${issue.title}
**Rule ID**: ${issue.rule_id}
**WCAG Guideline**: ${issue.wcag_id} (Level ${issue.level})
**Description**: ${issue.description}
**Current Impact**: ${issue.impact}
**Suggested Fix**: ${issue.fix}
**Affected HTML**: \`${issue.elements[0]?.html || 'N/A'}\`

Provide:
1. **Explanation**: Why this is an issue for users with disabilities (be specific about affected user groups)
2. **Fix**: Specific code or attribute changes needed to resolve it (provide actual code examples)
3. **Best Practice**: A one-line tip to avoid this in the future

Format your response in clear sections with bold headers.
`;

    for (const modelName of this.modelsToTry) {
      try {
        const model = this.genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = await response.text();

        const enrichment = {
          ai_explanation: text,
          ai_fix: issue.fix,
          ai_best_practice: 'Follow WCAG 2.2 best practices.',
          ai_enriched: true
        };

        // Cache result
        this.cache.set(issue.rule_id, enrichment);

        return { ...issue, ...enrichment };

      } catch (err) {
        if (err.status === 404) continue;
        throw err;
      }
    }

    return { ...issue, ...this.getDefaultEnrichment(issue) };
  }

  /**
   * Clear the cache
   */
  clearCache() {
    this.cache.clear();
    console.log('[AI] Cache cleared');
  }

  /**
   * Get cache stats
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Utility delay function
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
let serviceInstance = null;

export function getAIEnrichmentService(apiKey) {
  if (!serviceInstance) {
    serviceInstance = new AIEnrichmentService(apiKey);
  }
  return serviceInstance;
}

export default AIEnrichmentService;
