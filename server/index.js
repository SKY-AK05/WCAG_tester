
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { chromium } from 'playwright';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { fileURLToPath } from 'url';
import path from 'path';

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

// --- Modified runScan ---

async function runScan(targetUrl, socket, options) {
  let browser;
  try {
    console.log(`Starting scan for: ${targetUrl}`);
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
    
    socket.emit('scan-progress', { status: 'Processing', progress: 70, details: 'Mapping violations to WCAG 2.2...' });
    
    // Process results and capture screenshots
    socket.emit('scan-progress', { status: 'Capturing Evidence', progress: 70, details: 'Taking visual snippets of violations...' });
    
    const processedIssues = [];
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
        why_matters: "Accessibility violations impact users with disabilities and can lead to legal non-compliance.",
        ai_suggestion: "Pending AI Review..."
      });
    }

    if (options.aiAssisted && process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY_HERE') {
      socket.emit('scan-progress', { status: 'AI Reviewing', progress: 85, details: 'Performing semantic and UX analysis on key issues...' });
      
      // Analyze top 3 critical/serious issues
      const topIssues = processedIssues.slice(0, 3);
      for (let issue of topIssues) {
        issue.ai_suggestion = await getAIReview(issue, {});
      }
    } else {
      processedIssues.forEach(i => {
        i.ai_suggestion = "Provide semantic structural elements and alternative text for all non-text content to ensure compliance.";
      });
    }

    const finalReport = {
      url: targetUrl,
      title: pageTitle,
      score: calculateScore(processedIssues),
      issues: processedIssues,
      timestamp: new Date().toISOString()
    };

    console.log(`[SCAN] Complete! Detected ${processedIssues.length} violations at score ${finalReport.score}`);
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
