/* --- Global Note: 'io' is provided by the CDN script in index.html --- */

// Vanta Initialization
if (typeof VANTA !== 'undefined') {
  VANTA.DOTS({
    el: "#vanta-bg",
    mouseControls: true,
    touchControls: true,
    gyroControls: false,
    minHeight: 200.00,
    minWidth: 200.00,
    scale: 1.00,
    scaleMobile: 1.00,
    color: 0xff260f,
    color2: 0xff8820,
    backgroundColor: 0xf9f9f9,
    size: 6.00,
    spacing: 49.00,
    showLines: false
  });
}

// --- State Management ---
const state = {
  url: "",
  results: null,
  activeIssue: null,
  filters: {
    level: ["A", "AA"],
    severity: ["critical", "serious", "moderate", "minor"],
    status: ["fail", "review", "fixed"]
  },
  isScanning: false
};

// --- DOM Elements ---
const entryScreen = document.getElementById('entry-screen');
const appShell = document.getElementById('app-shell');
const startBtn = document.getElementById('start-scan-btn');
const urlInput = document.getElementById('target-url');
const loadingOverlay = document.getElementById('loading-overlay');
const loadingStatus = document.getElementById('loading-status');
const loadingProgress = document.getElementById('loading-progress');
const progressBar = document.getElementById('progress-bar');
const issueTableBody = document.getElementById('issue-list-body');
const detailPanel = document.getElementById('detail-panel');
const chatContainer = document.getElementById('chat-container');
const chatInput = document.getElementById('chat-input');
const sendChatBtn = document.getElementById('send-chat-btn');
const chatMessages = document.getElementById('chat-messages');

// Initial Lucide icons initialization
lucide.createIcons();

// --- Socket.io Connection ---
const SOCKET_URL = "http://localhost:3001";
const socket = io(SOCKET_URL, {
  reconnectionAttempts: 5,
  timeout: 10000
});

socket.on("connect", () => {
  console.log("✅ CONNECTED to scanning server:", SOCKET_URL);
  socket.emit('ping');
});

socket.on("server-ready", (data) => {
  console.log("🚀 SERVER_READY:", data);
  // Optional: show a green dot on the UI if possible
});

socket.on("pong", (data) => {
  console.log("🏓 PONG received:", data);
});

socket.on("connect_error", (error) => {
  console.error("❌ CONNECTION_ERROR:", error.message);
  loadingStatus.innerText = "Connection Failed";
  loadingProgress.innerText = `Cannot reach server at ${SOCKET_URL}. Is the backend running?`;
});

socket.on("scan-progress", (data) => {
  console.log("📊 PROGRESS:", data);
  loadingStatus.innerText = data.status || "Scanning...";
  loadingProgress.innerText = data.details || "";
  if (data.progress) {
    progressBar.style.width = `${data.progress}%`;
  }
});

socket.on("scan-complete", (results) => {
  state.results = results;
  state.isScanning = false;
  loadingOverlay.classList.add('hidden');
  entryScreen.classList.add('hidden');
  appShell.classList.remove('hidden');
  renderDashboard();
});

socket.on("scan-error", (error) => {
  alert("Scan failed: " + error.message);
  loadingOverlay.classList.add('hidden');
  state.isScanning = false;
});

socket.on("chat-response", (message) => {
  addChatMessage(message, 'ai');
});

// --- UI Actions ---

function renderDashboard() {
  console.log("Rendering Dashboard with results:", state.results);
  if (!state.results) return;
  
  // Update URL and Score
  const urlDisplay = document.getElementById('active-url-display');
  if (urlDisplay) urlDisplay.innerText = state.url.replace(/^https?:\/\//, '');
  
  const score = state.results.score || 0;
  document.getElementById('score-value').textContent = Math.round(score);
  document.getElementById('score-path').style.strokeDasharray = `${score}, 100`;
  
  // Update Stats
  const criticalCount = state.results.issues.filter(i => i.severity === 'critical' && i.status !== 'fixed').length;
  document.getElementById('stat-critical').innerText = criticalCount;

  renderIssueList();
}

function renderIssueList() {
  console.log("All issues from server:", state.results.issues);
  console.log("Current filters:", state.filters);
  
  const filteredIssues = state.results.issues.filter(issue => {
    return state.filters.level.includes(issue.level) &&
           state.filters.severity.includes(issue.severity) &&
           state.filters.status.includes(issue.status) &&
           issue.status !== 'ignored';
  });
  
  console.log("Filtered issues:", filteredIssues);

  // Check if we're showing passed results
  const isShowingPassed = state.filters.status.length === 1 && state.filters.status[0] === 'pass';
  
  // Update table headers based on view
  const tableHeaders = document.querySelector('#issue-table thead tr');
  if (isShowingPassed) {
    tableHeaders.innerHTML = `
      <th>Rule ID</th>
      <th>Guideline Title</th>
      <th>Status</th>
      <th>Elements Checked</th>
    `;
  } else {
    tableHeaders.innerHTML = `
      <th>Rule ID</th>
      <th>Guideline Title</th>
      <th>Status</th>
      <th>Severity</th>
      <th>Elements</th>
    `;
  }

  issueTableBody.innerHTML = filteredIssues.map(issue => {
    // Map severity to an icon
    let icon = 'alert-circle';
    if (issue.severity === 'critical') icon = 'zap';
    if (issue.severity === 'serious') icon = 'alert-triangle';
    if (issue.severity === 'moderate') icon = 'info';
    if (issue.status === 'pass') icon = 'check-circle';

    // Build WCAG tag links
    const wcagLinks = (issue.wcagTags || []).map(tag => 
      `<a href="${tag.url}" target="_blank" rel="noopener" class="wcag-link-badge" title="View ${tag.label} guideline" onclick="event.stopPropagation();">${tag.label}</a>`
    ).join('');
    
    return `
    <tr data-id="${issue.rule_id}" class="${issue.status === 'fixed' ? 'row-fixed' : ''}">
      <td>
        <div style="display: flex; align-items: center; gap: 12px;">
            <div class="severity-icon severity-${issue.severity}" style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 8px;">
                <i data-lucide="${icon}" style="width: 16px; height: 16px;"></i>
            </div>
            <span class="badge-rule">${issue.rule_id}</span>
        </div>
      </td>
      <td class="guideline-title">
        <div>${issue.title}</div>
        ${wcagLinks ? `<div style="margin-top: 6px; display: flex; gap: 6px; flex-wrap: wrap;">${wcagLinks}</div>` : ''}
      </td>
      <td><span class="status-indicator status-${issue.status}">${issue.status}</span></td>
      ${isShowingPassed ? 
        `<td style="font-weight: 700;">${issue.elements.length} elements</td>` :
        `<td><span class="badge badge-${issue.severity}">${issue.severity}</span></td>
         <td style="font-weight: 700;">${issue.elements.length} elements</td>`
      }
    </tr>
  `;
  }).join('');

  // Re-initialize icons for the newly added rows
  if (window.lucide) {
      lucide.createIcons();
  }

  // Add event listeners to rows
  issueTableBody.querySelectorAll('tr').forEach(row => {
    row.addEventListener('click', () => {
      const id = row.getAttribute('data-id');
      const issue = state.results.issues.find(i => i.rule_id === id);
      showIssueDetails(issue);
    });
  });
}

function showIssueDetails(issue) {
  state.activeIssue = issue;
  document.getElementById('detail-title').innerText = issue.title;
  document.getElementById('detail-desc').innerText = issue.description;
  document.getElementById('detail-impact').innerText = issue.why_matters || "This affects accessibility compliance.";
  document.getElementById('detail-code').textContent = issue.elements[0]?.html || "N/A";
  document.getElementById('detail-selector').innerText = issue.elements[0]?.selector || "N/A";

  // Render WCAG 2.2 reference links
  const wcagLinksContainer = document.getElementById('detail-wcag-links');
  const wcagTags = issue.wcagTags || [];
  const helpUrl = issue.helpUrl || null;
  
  let linksHTML = '';
  
  // Official WCAG 2.2 success criteria links
  wcagTags.forEach(tag => {
    linksHTML += `<a href="${tag.url}" target="_blank" rel="noopener" class="wcag-ref-link">
      <i data-lucide="external-link" style="width: 14px; height: 14px;"></i>
      <span>${tag.label} — Understanding this Success Criterion</span>
    </a>`;
  });
  
  // axe-core documentation link
  if (helpUrl) {
    linksHTML += `<a href="${helpUrl}" target="_blank" rel="noopener" class="wcag-ref-link" style="background: #e0f2fe;">
      <i data-lucide="book-open" style="width: 14px; height: 14px;"></i>
      <span>Deque axe-core: ${issue.rule_id} rule documentation</span>
    </a>`;
  }
  
  if (!linksHTML) {
    linksHTML = '<span style="color: #9e9e9e; font-size: 0.85rem;">No WCAG mapping available for this rule.</span>';
  }
  
  wcagLinksContainer.innerHTML = linksHTML;
  
  const badge = document.getElementById('detail-badge');
  badge.className = `badge badge-${issue.severity}`;
  badge.innerText = issue.severity.toUpperCase();

  // Visual Evidence Screenshot
  const evidenceSection = document.getElementById('visual-evidence-section');
  const detailImg = document.getElementById('detail-image');
  const screenshot = issue.elements[0]?.screenshot;
  
  if (screenshot) {
      detailImg.src = `data:image/png;base64,${screenshot}`;
      evidenceSection.classList.remove('hidden');
  } else {
      detailImg.src = "";
      evidenceSection.classList.add('hidden');
  }

  // Reset AI Fix section: show button, hide result
  const aiFixBtn = document.getElementById('get-ai-fix-btn');
  const aiFixResult = document.getElementById('ai-fix-result');
  aiFixBtn.classList.remove('hidden');
  aiFixBtn.disabled = false;
  aiFixBtn.innerHTML = `<i data-lucide="sparkles" style="width: 18px; height: 18px;"></i> Get AI Fix Suggestion`;
  aiFixResult.classList.add('hidden');
  document.getElementById('detail-ai-fix').innerHTML = '...';
  
  if (window.lucide) lucide.createIcons();

  detailPanel.classList.remove('hidden');
}

// --- On-Demand AI Fix Button ---
document.getElementById('get-ai-fix-btn')?.addEventListener('click', () => {
  const issue = state.activeIssue;
  if (!issue) return;

  const aiFixBtn = document.getElementById('get-ai-fix-btn');
  const aiFixResult = document.getElementById('ai-fix-result');

  // Show loading state
  aiFixBtn.disabled = true;
  aiFixBtn.innerHTML = `<i data-lucide="loader" style="width: 18px; height: 18px;" class="spin-icon"></i> Analyzing...`;
  if (window.lucide) lucide.createIcons();

  // Request AI fix from server
  socket.emit('get-ai-fix', {
    issue: issue,
    context: { domSummary: "..." }
  });
});

// Listen for AI fix response
socket.on('ai-fix-response', (data) => {
  const aiFixBtn = document.getElementById('get-ai-fix-btn');
  const aiFixResult = document.getElementById('ai-fix-result');

  // Hide button, show result
  aiFixBtn.classList.add('hidden');
  aiFixResult.classList.remove('hidden');
  document.getElementById('detail-ai-fix').innerHTML = data.suggestion || "AI could not generate a suggestion.";
  
  // Also store it on the issue so re-opening doesn't lose it
  if (state.activeIssue) {
    state.activeIssue.ai_suggestion = data.suggestion;
  }

  if (window.lucide) lucide.createIcons();
});

// --- Copy Report Feature ---
const copyBtn = document.getElementById('copy-issue-btn');
if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
        const issue = state.activeIssue;
        if (!issue) return;

        const reportText = `
ACCESSIBILITY AUDIT REPORT
--------------------------
ID: ${issue.rule_id}
Title: ${issue.title}
Severity: ${issue.severity.toUpperCase()}
Description: ${issue.description}
Impact: ${issue.why_matters || 'Affects accessibility compliance.'}

Affected Element:
${issue.elements[0]?.html || 'N/A'}

AI Fix Suggestion:
${(issue.ai_suggestion || '').replace(/<[^>]*>/g, '')}
        `.trim();

        try {
            const clipboardItems = {
                "text/plain": new Blob([reportText], { type: "text/plain" })
            };

            // Attempt to copy image if present
            if (issue.elements[0]?.screenshot) {
                try {
                    const resp = await fetch(`data:image/png;base64,${issue.elements[0].screenshot}`);
                    const blob = await resp.blob();
                    clipboardItems["image/png"] = blob;
                } catch (imgErr) {
                    console.warn("Could not process image for clipboard:", imgErr);
                }
            }

            // Using the modern Clipboard API
            await navigator.clipboard.write([
                new ClipboardItem(clipboardItems)
            ]);
            
            // Visual Feedback
            const originalContent = copyBtn.innerHTML;
            copyBtn.innerHTML = `<i data-lucide="check" style="width: 14px; height: 14px; color: #10b981;"></i> Copied!`;
            if (window.lucide) lucide.createIcons();
            
            setTimeout(() => {
                copyBtn.innerHTML = originalContent;
                if (window.lucide) lucide.createIcons();
            }, 2000);

        } catch (err) {
            console.error("Clipboard Error:", err);
            // Fallback for simple text if multi-item fails
            try {
                await navigator.clipboard.writeText(reportText);
                alert("Copied text report (Image copy not supported by this browser).");
            } catch (fail) {
                alert("Failed to copy to clipboard.");
            }
        }
    });
}

// --- Copy Image Only Feature ---
const copyImgBtn = document.getElementById('copy-image-btn');
if (copyImgBtn) {
    copyImgBtn.addEventListener('click', async () => {
        const issue = state.activeIssue;
        const screenshot = issue?.elements[0]?.screenshot;
        if (!screenshot) return;

        try {
            const resp = await fetch(`data:image/png;base64,${screenshot}`);
            const blob = await resp.blob();
            
            await navigator.clipboard.write([
                new ClipboardItem({ "image/png": blob })
            ]);
            
            const originalContent = copyImgBtn.innerHTML;
            copyImgBtn.innerHTML = `<i data-lucide="check" style="width: 14px; height: 14px; color: #10b981;"></i> Image Copied!`;
            if (window.lucide) lucide.createIcons();
            
            setTimeout(() => {
                copyImgBtn.innerHTML = originalContent;
                if (window.lucide) lucide.createIcons();
            }, 2000);

        } catch (err) {
            console.error("Image Copy Error:", err);
            alert("Failed to copy image to clipboard.");
        }
    });
}

function addChatMessage(text, sender) {
  const msgDiv = document.createElement('div');
  msgDiv.className = `message ${sender === 'ai' ? 'ai-message' : 'user-message'}`;
  msgDiv.innerHTML = text;
  chatMessages.appendChild(msgDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// --- Event Listeners ---

function handleStartScan(url) {
  if (!url) return alert("Please enter a valid URL");
  
  // Check if authentication is enabled and credentials are provided
  const enableAuth = document.getElementById('enable-auth').checked;
  const authUsername = document.getElementById('auth-username').value;
  const authPassword = document.getElementById('auth-password').value;
  
  if (enableAuth && (!authUsername || !authPassword)) {
    return alert("Please provide both username and password for authentication");
  }
  
  if (!socket.connected) {
    console.warn("⚠️ Cannot start scan: Socket not connected.");
    alert("Connection to scanning engine lost. Waiting for reconnection...");
    return;
  }

  state.url = url;
  state.isScanning = true;
  loadingOverlay.classList.remove('hidden');
  loadingStatus.innerText = "Initializing...";
  loadingProgress.innerText = "Waiting for backend response...";
  
  // Update active URL display
  const urlDisplay = document.getElementById('active-url-display');
  if (urlDisplay) urlDisplay.innerText = url;

  console.log(`📤 EMITTING start-scan for: ${url}`);
  
  // Prepare scan options
  const scanOptions = {
    aiAssisted: document.getElementById('ai-assisted').checked
  };
  
  // Add authentication options if enabled
  if (enableAuth) {
    scanOptions.enableAuth = true;
    scanOptions.credentials = {
      username: authUsername,
      password: authPassword
    };
  }
  
  socket.emit('start-scan', {
    url: url,
    options: scanOptions
  });
}

startBtn.addEventListener('click', () => {
  handleStartScan(urlInput.value.trim());
});

document.getElementById('inline-scan-btn')?.addEventListener('click', () => {
    const inlineInput = document.getElementById('inline-url');
    handleStartScan(inlineInput.value.trim());
    inlineInput.value = '';
});

// Authentication checkbox toggle
document.getElementById('enable-auth')?.addEventListener('change', (e) => {
    const authCredentials = document.getElementById('auth-credentials');
    authCredentials.style.display = e.target.checked ? 'flex' : 'none';
});

sendChatBtn.addEventListener('click', () => {
  const text = chatInput.value.trim();
  if (!text) return;
  
  addChatMessage(text, 'user');
  chatInput.value = '';
  
  socket.emit('chat-message', {
    text,
    context: { 
      activeIssue: state.activeIssue,
      allIssues: state.results?.issues
    }
  });
});

chatInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendChatBtn.click();
});

document.getElementById('validate-issue')?.addEventListener('click', () => {
  if (state.activeIssue) {
    state.activeIssue.status = 'fixed';
    renderDashboard();
    detailPanel.classList.add('hidden');
  }
});

document.getElementById('ignore-issue')?.addEventListener('click', () => {
  if (state.activeIssue) {
    state.activeIssue.status = 'ignored';
    renderDashboard();
    detailPanel.classList.add('hidden');
  }
});

document.querySelector('.close-panel')?.addEventListener('click', () => {
  detailPanel.classList.add('hidden');
  state.activeIssue = null;
});


// Chat UI interactions (Three View Mode)
document.getElementById('toggle-chat-sidebar')?.addEventListener('click', () => {
    appShell.classList.toggle('chat-open');
});

document.querySelector('.minimize-chat')?.addEventListener('click', () => {
    appShell.classList.remove('chat-open');
});

// Sidebar filters
document.querySelectorAll('.sidebar input[type="checkbox"]').forEach(checkbox => {
  checkbox.addEventListener('change', () => {
    const parent = checkbox.closest('.sidebar-section');
    const type = parent ? parent.querySelector('h3').innerText.toLowerCase() : '';
    const val = checkbox.value;
    
    if (type.includes('level')) {
      if (checkbox.checked) state.filters.level.push(val);
      else state.filters.level = state.filters.level.filter(v => v !== val);
    } 
    
    renderIssueList();
  });
});

// Main Content Pill Filters
document.querySelectorAll('.pill').forEach(pill => {
    pill.addEventListener('click', () => {
        document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        
        const filter = pill.getAttribute('data-filter');
        
        // Reset all filtering for severity and status before applying specific pill logic
        state.filters.severity = ["critical", "serious", "moderate", "minor"];
        state.filters.status = ["fail", "review", "fixed"];

        if (filter === 'critical' || filter === 'serious' || filter === 'moderate') {
            state.filters.severity = [filter];
            state.filters.status = ["fail", "review"];
        }
        
        renderIssueList();
    });
});

// View Tabs (Detected/Passed)
const tabDetected = document.getElementById('tab-detected');
const tabPassed = document.getElementById('tab-passed');
const mainFilters = document.getElementById('main-filters');

tabDetected?.addEventListener('click', () => {
    tabDetected.classList.add('active');
    tabPassed.classList.remove('active');
    mainFilters.classList.remove('hidden');
    
    state.filters.status = ["fail", "review", "fixed"];
    renderIssueList();
});

tabPassed?.addEventListener('click', () => {
    tabPassed.classList.add('active');
    tabDetected.classList.remove('active');
    mainFilters.classList.add('hidden');
    
    state.filters.status = ["pass"];
    renderIssueList();
});

// Rules View Logic
const rulesBtn = document.getElementById('toggle-rules');
const rulesView = document.getElementById('rules-view');
const mainArea = document.querySelector('main.main-content');
const closeRulesBtn = document.getElementById('close-rules');
const rulesContent = document.getElementById('rules-content');

rulesBtn?.addEventListener('click', async () => {
    // Hide main results, show rules
    mainArea.classList.add('hidden');
    rulesView.classList.remove('hidden');
    
    // Fetch and simple render of rules.md
    try {
        const response = await fetch('/rules.md');
        if (!response.ok) throw new Error("Could not load rules.md");
        let text = await response.text();
        
        // Basic Markdown-ish formatting
        text = text
            .replace(/^# (.*$)/gm, '<h1 style="font-size: 2.2rem; margin-bottom: 24px;">$1</h1>')
            .replace(/^## (.*$)/gm, '<h2 style="font-size: 1.8rem; margin-top: 40px; margin-bottom: 16px; color: var(--accent-primary);">$1</h2>')
            .replace(/^### (.*$)/gm, '<h3 style="font-size: 1.2rem; margin-top: 24px; margin-bottom: 12px; color: #1a1a1a;">$1</h3>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/^\* (.*$)/gm, '<li style="margin-left: 20px;">$1</li>')
            .replace(/\n/g, '<br/>');

        rulesContent.innerHTML = text;
    } catch (e) {
        rulesContent.innerText = "Error loading rules: " + e.message;
    }
});

closeRulesBtn?.addEventListener('click', () => {
    rulesView.classList.add('hidden');
    mainArea.classList.remove('hidden');
});

// Search functionality
document.getElementById('issue-search')?.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    const rows = issueTableBody.querySelectorAll('tr');
    rows.forEach(row => {
        const text = row.innerText.toLowerCase();
        row.style.display = text.includes(query) ? '' : 'none';
    });
});
