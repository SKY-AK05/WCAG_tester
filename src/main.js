/* --- Global Note: 'io' is provided by the CDN script in index.html --- */

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
  document.getElementById('display-url').innerText = state.url;
  const score = state.results.score || 0;
  document.getElementById('score-value').textContent = Math.round(score);
  document.getElementById('score-path').style.strokeDasharray = `${score}, 100`;
  
  // Update Stats
  document.getElementById('stat-total-issues').innerText = state.results.issues.length;
  const criticalCount = state.results.issues.filter(i => i.severity === 'critical' && i.status !== 'fixed').length;
  document.getElementById('stat-critical').innerText = criticalCount;
  const fixedCount = state.results.issues.filter(i => i.status === 'fixed').length;
  document.getElementById('stat-fixed').innerText = fixedCount;

  renderIssueList();
}

function renderIssueList() {
  const filteredIssues = state.results.issues.filter(issue => {
    return state.filters.level.includes(issue.level) &&
           state.filters.severity.includes(issue.severity) &&
           state.filters.status.includes(issue.status) &&
           issue.status !== 'ignored';
  });

  issueTableBody.innerHTML = filteredIssues.map(issue => `
    <tr data-id="${issue.rule_id}" class="${issue.status === 'fixed' ? 'row-fixed' : ''}">
      <td><span class="badge-rule">${issue.rule_id}</span></td>
      <td class="guideline-title">${issue.title}</td>
      <td><span class="status-indicator status-${issue.status}">${issue.status}</span></td>
      <td><span class="badge badge-${issue.severity}">${issue.severity}</span></td>
      <td>${issue.elements.length}</td>
    </tr>
  `).join('');

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
  document.getElementById('detail-ai-fix').innerHTML = issue.ai_suggestion || "AI is analyzing a fix...";
  
  const badge = document.getElementById('detail-badge');
  badge.className = `badge badge-${issue.severity}`;
  badge.innerText = issue.severity;

  detailPanel.classList.remove('hidden');
  
  // Auto-send a message to AI about this issue if chat is empty or just to provide context
  addChatMessage(`I'm looking at issue **${issue.rule_id}: ${issue.title}**. What's the best way to fix this?`, 'user');
  socket.emit('chat-message', {
    text: `Provide a detailed explanation and fix for ${issue.rule_id}`,
    context: { issue, domSummary: "..." }
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

startBtn.addEventListener('click', () => {
  const url = urlInput.value.trim();
  if (!url) return alert("Please enter a valid URL");
  
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
  
  console.log(`📤 EMITTING start-scan for: ${url}`);
  socket.emit('start-scan', {
    url: url,
    options: {
      aiAssisted: document.getElementById('ai-assisted').checked
    }
  });
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

document.querySelector('.minimize-chat')?.addEventListener('click', () => {
  chatContainer.classList.toggle('minimized');
});

// Sidebar filters
document.querySelectorAll('.sidebar input[type="checkbox"]').forEach(checkbox => {
  checkbox.addEventListener('change', () => {
    const type = checkbox.parentNode.parentNode.previousElementSibling.innerText.toLowerCase();
    const val = checkbox.value;
    
    if (type.includes('level')) {
      if (checkbox.checked) state.filters.level.push(val);
      else state.filters.level = state.filters.level.filter(v => v !== val);
    } else if (type.includes('severity')) {
      if (checkbox.checked) state.filters.severity.push(val);
      else state.filters.severity = state.filters.severity.filter(v => v !== val);
    } else if (type.includes('status')) {
      if (checkbox.checked) state.filters.status.push(val);
      else state.filters.status = state.filters.status.filter(v => v !== val);
    }
    
    renderIssueList();
  });
});
