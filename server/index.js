
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
import { extractWcagTags, mapToWCAGLevel } from './wcagUtils.js';
import { normalizeIssue, normalizePasses, createIssueSummary, sortIssuesByPriority } from './issueNormalizer.js';
import { getAIEnrichmentService } from './aiEnrichmentService.js';

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
const aiService = getAIEnrichmentService(process.env.GEMINI_API_KEY);

// Global lock to prevent concurrent scans (RAM exhaustion protection)
let isScanRunning = false;

/**
 * Enhanced Issue Processor - Transforms axe results with AI enrichment
 */
async function processScanResults(axeResults, page, targetUrl, pageTitle) {
  const allIssues = [];

  // Process violations (failures)
  console.log(`[PROCESS] Processing ${axeResults.violations.length} violations...`);
  for (const violation of axeResults.violations) {
    const elements = await processViolationElements(violation.nodes, page);
    const normalizedIssue = normalizeIssue(violation, 'fail', elements);
    allIssues.push(normalizedIssue);
  }

  // Process passed rules
  if (axeResults.passes && axeResults.passes.length > 0) {
    console.log(`[PROCESS] Processing ${axeResults.passes.length} passed rules...`);
    const passedIssues = normalizePasses(axeResults.passes);
    allIssues.push(...passedIssues);
  }

  // Sort by priority (critical first)
  const sortedIssues = sortIssuesByPriority(allIssues);

  // Generate summary
  const summary = createIssueSummary(sortedIssues);

  return {
    url: targetUrl,
    title: pageTitle,
    score: summary.score,
    summary: summary,
    issues: sortedIssues,
    timestamp: new Date().toISOString()
  };
}

/**
 * Process violation elements with screenshots
 */
async function processViolationElements(nodes, page) {
  const elements = [];

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const selector = node.target.join(' > ');

    let screenshotBase64 = null;

    // Only screenshot first element for performance
    if (i === 0 && page) {
      try {
        const locator = page.locator(selector).first();
        await locator.scrollIntoViewIfNeeded({ timeout: 2000 });
        const buffer = await locator.screenshot({ timeout: 3000 });
        screenshotBase64 = buffer.toString('base64');
      } catch (e) {
        // Silent fail - screenshot not critical
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

// Legacy single-issue AI review (kept for backward compatibility)
async function getAIReview(issue, contextData) {
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
    return "AI-driven fix analysis requires a valid Gemini API key. Please check your .env file.";
  }

  const enriched = await aiService.enrichSingleIssue(issue);
  return enriched.ai_explanation || enriched.ai_fix || "AI analysis completed.";
}

// --- Enhanced runScan with Authentication Support ---

async function runScan(targetUrl, socket, options = {}) {
  if (isScanRunning) {
    console.warn(`⚠️ Scan already in progress. Rejecting request for: ${targetUrl}`);
    socket.emit('scan-error', { message: 'A scan is already in progress. Please wait for it to finish.' });
    return;
  }

  isScanRunning = true;
  let browser = null; 
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
        await authIntegration.cleanup(); // Free memory
        return;
      }
    }
    
    // Fall back to standard scan
    console.log('📄 Using standard scan flow');
    socket.emit('scan-progress', { status: 'Launching Browser', progress: 10, details: 'Launching Chromium...' });
    
    const browserlessToken = process.env.BROWSERLESS_API_KEY;
    
    if (browserlessToken) {
      const cleanToken = browserlessToken.includes('token=') ? browserlessToken.split('token=')[1] : browserlessToken;
      const wsEndpointPlaywright = `wss://production-sfo.browserless.io/playwright?token=${cleanToken.trim()}`;
      const wsEndpointRoot = `wss://production-sfo.browserless.io/?token=${cleanToken.trim()}`;
      
      console.log(`[BROWSER] 🌐 Connecting to Browserless.io SFO...`);
      try {
        browser = await chromium.connect({ wsEndpoint: wsEndpointPlaywright });
        console.log(`[BROWSER] ✅ Connected via /playwright endpoint`);
      } catch (err) {
        console.warn(`[BROWSER] ⚠️ /playwright failed, retrying with root endpoint...`);
        browser = await chromium.connect({ wsEndpoint: wsEndpointRoot });
        console.log(`[BROWSER] ✅ Connected via root endpoint`);
      }
    } else {
      console.log(`[BROWSER] 💻 Launching local instance (Headed)...`);
      browser = await chromium.launch({ 
        headless: false, 
        slowMo: 100 
      });
    }
    
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
    
    socket.emit('scan-progress', { status: 'Processing', progress: 70, details: 'Normalizing and enriching results...' });
    
    // Process results using enhanced normalizer
    const report = await processScanResults(axeResults, page, targetUrl, pageTitle);
    
    // AI Enrichment - batch process violations only
    socket.emit('scan-progress', { status: 'AI Enrichment', progress: 85, details: 'Generating AI explanations...' });
    
    const violations = report.issues.filter(i => i.status === 'fail');
    if (violations.length > 0 && aiService.isAvailable()) {
      console.log(`[SCAN] Enriching ${violations.length} violations with AI...`);
      
      const enrichedViolations = await aiService.enrichIssues(violations, {
        batchSize: 5,
        onlyFailures: true,
        onProgress: (progress) => {
          const percent = 85 + Math.round(progress.percentage * 0.1);
          socket.emit('scan-progress', { 
            status: 'AI Enrichment', 
            progress: percent, 
            details: `Processed ${progress.current}/${progress.total} issues...` 
          });
        }
      });
      
      // Replace violations in report with enriched versions
      report.issues = report.issues.map(issue => {
        if (issue.status === 'fail') {
          const enriched = enrichedViolations.find(e => e.rule_id === issue.rule_id);
          return enriched || issue;
        }
        return issue;
      });
    }

    console.log(`[SCAN] Complete! Detected ${report.summary.violations} violations and ${report.summary.passes} passed rules at score ${report.score}`);
    socket.emit('scan-complete', report);
    
  } catch (error) {
    console.error(`[ERROR] Scan failed:`, error.message);
    socket.emit('scan-error', { message: `Scanning error: ${error.message}` });
  } finally {
    isScanRunning = false;
    if (browser) await browser.close();
  }
}

// --- Helpers ---

function calculateScore(issues) {
  const penalty = issues.reduce((acc, i) => {
    const p = i.severity === 'critical' ? 8 : (i.severity === 'serious' ? 4 : 1);
    return acc + (p * Math.min(i.elements.length, 5));
  }, 0);
  return Math.max(0, 100 - penalty);
}

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
