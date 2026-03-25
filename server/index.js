
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { chromium } from 'playwright';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { fileURLToPath } from 'url';
import path from 'path';
import AuthIntegration from './authIntegration.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*" }
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "AI_KEY_NOT_FOUND");

// Initialize Auth Integration
const authIntegration = new AuthIntegration();

// --- Scan Service ---

// --- AI Service ---

async function getAIReview(issue, contextData) {
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
    return "AI-driven fix analysis requires a valid Gemini API key. Please check your .env file.";
  }

  const prompt = `
    You are an expert Web Accessibility Auditor (WCAG 2.2 Specialist).
    Analyze the following accessibility issue and provide a human-readable fix.
    **Rule**: ${issue.title} (${issue.rule_id})
    **WCAG Guideline**: ${issue.level}
    **Affected Element HTML**: \`${issue.elements[0]?.html}\`
    **Failure Summary**: ${issue.elements[0]?.summary}
    Please provide:
    1. **Explanation**: Why this is an issue for users with disabilities.
    2. **Fix**: Specific code or attribute changes needed to resolve it.
    3. **Best Practice**: A one-line tip to avoid this in the future.
    Format the output with light HTML (bold, lists) but NO markdown backticks in the response.
  `;

  try {
    const modelsToTry = ["gemini-flash-latest", "gemini-pro-latest", "gemini-2.0-flash", "gemini-2.5-flash"];
    let lastError = null;
    
    for (const modelName of modelsToTry) {
      try {
        console.log(`[AI] Attempting review with: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return (await response.text());
      } catch (err) {
        lastError = err;
        if (err.status === 404) {
          console.warn(`[AI] Model ${modelName} not found, trying fallback...`);
          continue;
        }
        throw err; 
      }
    }
    throw lastError;
  } catch (error) {
    console.error("Gemini Error:", error.message);
    return "AI analysis failed. Please check logs.";
  }
}

// --- Enhanced runScan with Authentication Support ---

async function runScan(targetUrl, socket, options = {}) {
  let browser = null; // Declare browser at function level
  try {
    console.log(`Starting scan for: ${targetUrl}`);
    
    // Check if authentication is enabled
    if (options.enableAuth && options.credentials) {
      console.log('🔐 Using authenticated scan flow');
      socket.emit('scan-progress', { status: 'Initializing Authenticated Scan', progress: 5, details: 'Preparing authentication flow...' });
      
      const authResults = await authIntegration.runAuthenticatedScan(targetUrl, options);
      
      if (authResults) {
        console.log('✅ Authenticated scan completed');
        socket.emit('scan-complete', authResults);
        return;
      }
    }
    
    // Fall back to standard scan
    console.log('📄 Using standard scan flow');
    socket.emit('scan-progress', { status: 'Launching Browser', progress: 10, details: 'Launching Chromium...' });
    
    browser = await chromium.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    
    console.log(`Browser launched successfully.`);
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      bypassCSP: true // Essential for institutional sites with strict CSP
    });
    
    const page = await context.newPage();
    
    console.log(`[SCAN] Navigating to: ${targetUrl}`);
    socket.emit('scan-progress', { status: 'Navigating', progress: 30, details: `Loading ${targetUrl}...` });
    
    // Use networkidle and add a short delay for SPAs
    await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 60000 });
    await new Promise(r => setTimeout(r, 2000)); // Extra wait for rendering
    
    const pageTitle = await page.title();
    console.log(`[SCAN] Title: ${pageTitle}`);
    
    socket.emit('scan-progress', { status: 'Auditing', progress: 50, details: 'Executing axe-core engine...' });
    
    // Absolute path for axe-core
    const axePath = path.join(__dirname, '../node_modules/axe-core/axe.min.js');
    console.log(`[DEBUG] Injecting axe-core from: ${axePath}`);
    await page.addScriptTag({ path: axePath });
    
    console.log(`[SCAN] Running axe.run()...`);
    const axeResults = await page.evaluate(async () => {
      return await axe.run();
    });
    
    socket.emit('scan-progress', { status: 'Processing', progress: 70, details: 'Mapping violations and passed rules to WCAG 2.2...' });
    
    // Process results and capture screenshots
    socket.emit('scan-progress', { status: 'Capturing Evidence', progress: 70, details: 'Taking visual snippets of violations...' });
    
    const processedIssues = [];
    
    // Process violations (failed rules)
    for (const v of axeResults.violations) {
      const elements = [];
      
      for (let i = 0; i < v.nodes.length; i++) {
        const n = v.nodes[i];
        const selector = n.target.join(' > ');
        let screenshotBase64 = null;
        
        // Only take 1 screenshot per issue for performance
        if (i === 0) {
          try {
            const locator = page.locator(selector).first();
            // Ensure element is visible before screenshot
            await locator.scrollIntoViewIfNeeded({ timeout: 2000 });
            const buffer = await locator.screenshot({ timeout: 3000 });
            screenshotBase64 = buffer.toString('base64');
          } catch (e) {
            console.warn(`[SCAN] Could not capture screenshot for ${selector}:`, e.message);
          }
        }
        
        elements.push({
          html: n.html,
          selector: selector,
          summary: n.failureSummary,
          screenshot: screenshotBase64
        });
      }

      processedIssues.push({
        rule_id: v.id,
        title: v.help,
        description: v.description,
        status: 'fail',
        severity: v.impact === 'critical' ? 'critical' : (v.impact === 'serious' ? 'serious' : (v.impact === 'moderate' ? 'moderate' : 'minor')),
        level: mapToWCAGLevel(v.id), 
        category: 'Perceivable',
        elements: elements,
        helpUrl: v.helpUrl || null,
        wcagTags: extractWcagTags(v.tags || []),
        why_matters: "Accessibility violations impact users with disabilities and can lead to legal non-compliance.",
        ai_suggestion: "Pending AI Review..."
      });
    }
    
    // Process passes (passed rules)
    if (axeResults.passes && axeResults.passes.length > 0) {
      for (const p of axeResults.passes) {
        const elements = [];
        
        for (let i = 0; i < Math.min(p.nodes.length, 3); i++) {
          const n = p.nodes[i];
          const selector = n.target.join(' > ');
          
          elements.push({
            html: n.html,
            selector: selector,
            summary: "This element passes the accessibility check",
            screenshot: null
          });
        }

        processedIssues.push({
          rule_id: p.id,
          title: p.help,
          description: p.description,
          status: 'pass',
          severity: 'minor',
          level: mapToWCAGLevel(p.id), 
          category: 'Perceivable',
          elements: elements,
          helpUrl: p.helpUrl || null,
          wcagTags: extractWcagTags(p.tags || []),
          why_matters: "This accessibility rule has been successfully implemented.",
          ai_suggestion: "No action needed - this rule is properly implemented."
        });
      }
    }

    // AI suggestions are now on-demand (triggered by user clicking 'Get AI Fix' button)
    processedIssues.forEach(i => {
      i.ai_suggestion = null; // Will be populated on-demand
    });

    const finalReport = {
      url: targetUrl,
      title: pageTitle,
      score: calculateScore(processedIssues),
      issues: processedIssues,
      timestamp: new Date().toISOString()
    };

    console.log(`[SCAN] Complete! Detected ${processedIssues.filter(i => i.status === 'fail').length} violations and ${processedIssues.filter(i => i.status === 'pass').length} passed rules at score ${finalReport.score}`);
    socket.emit('scan-complete', finalReport);
    
  } catch (error) {
    console.error(`[ERROR] Scan failed:`, error.message);
    socket.emit('scan-error', { message: `Scanning error: ${error.message}` });
  } finally {
    if (browser) await browser.close();
  }
}

// --- Helpers ---

function mapToWCAGLevel(ruleId) {
  const mapping = {
    'color-contrast': 'AA',
    'image-alt': 'A',
    'label': 'A',
    'link-name': 'A',
    'button-name': 'A',
    'aria-roles': 'A'
  };
  return mapping[ruleId] || 'AA';
}

function calculateScore(issues) {
  const penalty = issues.reduce((acc, i) => {
    const p = i.severity === 'critical' ? 8 : (i.severity === 'serious' ? 4 : 1);
    return acc + (p * Math.min(i.elements.length, 5));
  }, 0);
  return Math.max(0, 100 - penalty);
}

/**
 * Extract WCAG success criteria from axe-core tags and generate official URLs.
 * axe-core tags look like: ['wcag2a', 'wcag111', 'cat.text-alternatives']
 * 'wcag111' = WCAG SC 1.1.1, 'wcag143' = WCAG SC 1.4.3, etc.
 */
function extractWcagTags(tags) {
  // Map WCAG SC numbers to their URL slugs on w3.org
  const scToSlug = {
    '111': 'non-text-content',
    '121': 'audio-only-and-video-only-prerecorded',
    '122': 'captions-prerecorded',
    '123': 'audio-description-or-media-alternative-prerecorded',
    '131': 'info-and-relationships',
    '132': 'meaningful-sequence',
    '133': 'sensory-characteristics',
    '141': 'use-of-color',
    '142': 'audio-control',
    '143': 'contrast-minimum',
    '144': 'resize-text',
    '145': 'images-of-text',
    '146': 'contrast-enhanced',
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
    '255': 'target-size-minimum',
    '256': 'dragging-movements',
    '257': 'target-size-minimum',
    '311': 'language-of-page',
    '312': 'language-of-parts',
    '321': 'on-focus',
    '322': 'on-input',
    '323': 'consistent-navigation',
    '324': 'consistent-identification',
    '331': 'error-identification',
    '332': 'labels-or-instructions',
    '333': 'error-suggestion',
    '411': 'parsing',
    '412': 'name-role-value',
    '413': 'status-messages',
  };

  const results = [];
  
  for (const tag of tags) {
    // Match tags like 'wcag111', 'wcag143', 'wcag2a', 'wcag21a', etc.
    const scMatch = tag.match(/^wcag(\d{3,4})$/);
    if (scMatch) {
      const scNum = scMatch[1];
      // Format: '111' → '1.1.1', '143' → '1.4.3'
      const formatted = scNum.length === 3 
        ? `${scNum[0]}.${scNum[1]}.${scNum[2]}`
        : `${scNum[0]}.${scNum[1]}.${scNum[2]}${scNum[3]}`;
      
      const slug = scToSlug[scNum.substring(0, 3)] || null;
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

// --- Socket.io Events ---

io.on('connection', (socket) => {
  console.log(`[SOCKET] User connected: ${socket.id}`);
  
  // Heartbeat to confirm connection
  socket.emit('server-ready', { time: new Date().toISOString(), serverStatus: 'ONLINE' });
  
  socket.on('ping', () => {
    socket.emit('pong', { time: Date.now() });
  });

  socket.on('start-scan', async (data) => {
    console.log(`[SCAN] Received request for: ${data.url}`);
    if (!data.url) {
      return socket.emit('scan-error', { message: 'No URL provided' });
    }
    await runScan(data.url, socket, data.options || {});
  });
  
  socket.on('chat-message', async (data) => {
    console.log(`[CHAT] Message received: ${data.text}`);
    if (!process.env.GEMINI_API_KEY) {
      return socket.emit('chat-response', "AI is currently offline (No API key found).");
    }

    try {
      const modelsToTry = ["gemini-flash-latest", "gemini-pro-latest", "gemini-2.0-flash", "gemini-2.5-flash"];
      const context = JSON.stringify(data.context || {});
      const chatPrompt = `
        You are an Accessibility Assistant.
        User asks: ${data.text}
        Previous findings context: ${context}
        Provide a concise, helpful answer on how to fix the issue or understand the rule.
      `;

      let success = false;
      for (const modelName of modelsToTry) {
        try {
          const model = genAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContent(chatPrompt);
          const response = await result.response;
          socket.emit('chat-response', (await response.text()));
          success = true;
          break;
        } catch (mErr) {
          if (mErr.status === 404) continue;
          throw mErr;
        }
      }
      if (!success) throw new Error("All AI models returned 404.");
    } catch (err) {
      console.error("Chat AI error:", err);
      socket.emit('chat-response', "Sorry, I had trouble processing that request. My AI engine might be busy.");
    }
  });

  socket.on('disconnect', () => {
    console.log(`[SOCKET] User disconnected: ${socket.id}`);
  });

  // On-demand AI fix for a specific issue
  socket.on('get-ai-fix', async (data) => {
    console.log(`[AI-FIX] Requested for: ${data.issue?.rule_id}`);
    
    if (!data.issue) {
      return socket.emit('ai-fix-response', { suggestion: 'No issue data provided.' });
    }

    const suggestion = await getAIReview(data.issue, data.context || {});
    socket.emit('ai-fix-response', { suggestion });
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`==========================================`);
  console.log(`🚀 SCANNIG SERVER RUNNING: http://localhost:${PORT}`);
  console.log(`🚀 API KEY PRESENT: ${!!process.env.GEMINI_API_KEY}`);
  console.log(`==========================================`);
}).on('error', (err) => {
  console.error(`[ERROR] Server failed to start: ${err.message}`);
});
