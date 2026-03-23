# AI WCAG 2.2 Accessibility Auditor - Project Documentation
**Created on March 23, 2026**

This document provides an exhaustive overview of the architecture, implementation, and logic behind the AI-powered WCAG 2.2 Accessibility Auditor. It breaks down the system into its core components: Frontend, Backend, and AI Integration.

---

## 🏗️ 1. System Architecture

The application is built on a modern **Client-Server Architecture** using real-time bidirectional communication to provide a seamless user experience.

### Technology Stack
*   **Frontend**: 
    - **Vite**: Ultra-fast development server and build tool.
    - **Vanilla JavaScript**: Lightweight and high-performance logic.
    - **Vanilla CSS3**: Premium dark-mode design with Glassmorphism and CSS variables.
    - **Socket.io Client**: Real-time event-driven communication.
    - **Lucide Icons**: Crisp, vector-based interactive icons.
*   **Backend**: 
    - **Node.js & Express**: High-performance runtime and web server.
    - **Socket.io Server**: Manages duplex communication with the frontend.
    - **Playwright**: Headless browser automation (Chromium) for web scraping.
    - **axe-core**: The world's leading accessibility testing engine.
    - **Google Gemini 1.5 Pro**: Advanced AI for semantic reasoning and code fix generation.
    - **Nodemon**: Automatic server restarts during development.

---

## 🖥️ 2. Frontend: User Experience & Design

The frontend is designed with a **"Premium Dark Mode"** aesthetic, utilizing glassmorphism effects (blurred backgrounds and subtle borders) to feel like a state-of-the-art developer tool.

### Flow of User Interaction:
1.  **Entry Screen**: User arrives at a clean, focused portal. They enter a URL (e.g., `https://example.com`) and choose whether to enable "AI-Assisted Review."
2.  **Scan Initiation**: When the user clicks "Start Scan," the UI immediately transitions to a loading state. 
    - JavaScript emits the `start-scan` event via Socket.io.
    - The `loading-overlay` appears, blocking the UI while providing real-time text updates (e.g., "Navigating...", "Auditing...").
3.  **Dashboard Visualization**: Upon completion, the backend sends the `scan-complete` payload. The frontend dynamically populates the dashboard.
    - **Accessibility Score**: An SVG-based circular progress bar shows the overall grade.
    - **Issue List**: A filterable table displays detected violations, their WCAG level, and severity.
    - **Detail Panel**: Clicking an issue slides out a detail view containing the exact code snippet, the CSS selector, and an AI-generated fix suggestion.
    - **AI Assistant Chat**: A floating chat widget allows the user to ask questions about the current results.

### Core Frontend Logic (`src/main.js`):
- **State Management**: A single `state` object tracks the current URL, scan results, active filters, and scanning status.
- **Event Listeners**: Real-time listeners for `scan-progress`, `scan-complete`, and `scan-error` update the DOM reactively.
- **Filtering Engine**: A custom filter function reacts to sidebar checkboxes (Level A/AA, Severity) to instantly hide or show issues without re-scanning.

---

## ⚙️ 3. Backend: The Engine Room

The backend handles the "heavy lifting" by orchestrating browser automation, the accessibility engine, and AI processing.

### The Scanning Flow (`server/index.js`):
1.  **Headless Browser Launch**: When the `start-scan` event is received, the server starts a **Playwright Chromium instance** in the background. 
    - We use flags like `--no-sandbox` to ensure compatibility across different operating systems.
    - `bypassCSP: true` is enabled to allow script injection even on secure sites (like University portals).
2.  **Navigate & Hydrate**: The browser navigates to the target URL.
    - We use `waitUntil: 'networkidle'` to ensure modern Single-Page Applications (like React sites) have finished their JavaScript execution before we audit them.
    - A secondary 2-second buffer is added for extra rendering reliability.
3.  **Engine Injection**: The server takes the physical `axe-core` library from `node_modules` and injects it directly into the remote browser page using `page.addScriptTag`.
4.  **Auditing**: We execute `axe.run()` within the browser context. This returns a raw JSON of all accessibility violations found on the page.
5.  **Data Transformation**: The raw Axe output is transformed into a structured model:
    - **Severity Mapping**: Maps impact (critical, serious, etc.) to a human-readable format.
    - **WCAG Mapping**: Uses a heuristic to determine the specific success criterion (A, AA, AAA).
6.  **Scoring Logic**: We calculate a 0-100 score by applying "penalties" based on the severity and number of occurrences of each issue.
    - Critical issues subtract more points than minor ones.
7.  **AI Orchestration**: If powered by Gemini, the backend selects the most critical issues and sends them to Google’s AI with a specialized prompt. The AI returns a detailed HTML-formatted "Fix Strategy."

---

## 🤖 4. AI & Semantic Integration

Unlike standard auditors that only tell you *what* is wrong, this system uses **Generative AI** to tell you *how* to fix it.

### The AI Prompt Strategy:
We feed Gemini the specific accessibility violation, the failing HTML code, and the WCAG rule definition. The AI is instructed to:
- Act as a Senior Web Accessibility Expert.
- Provide a "Why it matters" explanation for non-technical stakeholders.
- Provide a copy-pasteable **HTML fix**.
- Explain the logic behind the correction.

---

## 🛠️ 5. Technical Highlights & "Gotchas"

During development, we implemented several critical fixes to ensure the tool is production-ready:
- **Windows Path Handling**: We used `fileURLToPath` and `path.join` to ensure the file system works correctly on Windows, avoiding common `/C:/` path errors.
- **Duplex Pings**: A heartbeat system ensures that if the server crashes or the internet blips, both sides know to reset gracefully.
- **CSS Utility Classes**: We implemented a `.hidden` utility with `!important` to prevent UI layout shifts during the initial application load.

## 📈 6. Future Expansion Paths
- **Multi-page Auditing**: Recursive spidering of entire domains.
- **PDF Generation**: Exporting the dashboard view into a formatted PDF report via `jspdf`.
- **Auto-Fix PRs**: Integrating with GitHub to automatically create pull requests with suggested accessibility fixes.

---
*End of Documentation*
