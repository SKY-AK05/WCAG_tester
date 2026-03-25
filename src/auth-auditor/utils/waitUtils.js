/**
 * waitUtils.js - Smart Page Readiness & Stability Detection System for Playwright
 */

/**
 * Wait for a page to be ready and "STABLE" using dynamic signals.
 * A page is considered ready when its URL, DOM structure, and network activity 
 * have settled for a required period.
 * 
 * @param {import('playwright').Page} page
 * @param {object} options
 * @returns {Promise<{success: boolean, status: string}>}
 */
export async function waitForPageReady(page, options = {}) {
  const {
    timeout = 60000,
    checkInterval = 1000,
    minContentLength = 100,
    networkIdlePeriod = 2000, // ms of no activity
    stabilityThreshold = 3,   // Consecutive stable checks required (seconds)
  } = options;

  console.log('🔄 Starting Smart Page Readiness & Stability Detection...');
  
  const startTime = Date.now();
  let activeRequests = 0;
  let lastRequestTime = Date.now();
  
  // Track network activity
  const onRequest = () => {
    activeRequests++;
    lastRequestTime = Date.now();
  };
  
  const onRequestEnd = () => {
    activeRequests = Math.max(0, activeRequests - 1);
    lastRequestTime = Date.now();
  };
  
  page.on('request', onRequest);
  page.on('requestfinished', onRequestEnd);
  page.on('requestfailed', onRequestEnd);
  
  // Stability tracking state
  let stabilityCount = 0;
  let previousState = {
    url: '',
    nodeCount: 0,
    textLength: 0
  };

  try {
    while (Date.now() - startTime < timeout) {
      // 1. Check DOM signals and get stability metrics
      const currentState = await page.evaluate((minLength) => {
        // Stability metrics
        const url = window.location.href;
        const nodeCount = document.querySelectorAll('*').length;
        const text = document.body ? document.body.innerText : '';
        const textLength = text.trim().length;
        
        // Loading Indicators
        const loaderSelectors = [
          '[class*="loading"]', '[class*="spinner"]', '[class*="skeleton"]', 
          '[class*="progress"]', '[id*="loading"]', '[id*="spinner"]',
          '[id*="loader"]', '[class*="loader"]',
          '[role="progressbar"]', '[aria-busy="true"]',
          '.ant-spin', '.skeleton-placeholder', '.loading-overlay'
        ];
        
        const isVisible = (el) => {
          const style = window.getComputedStyle(el);
          return style && 
                 style.display !== 'none' && 
                 style.visibility !== 'hidden' && 
                 style.opacity !== '0' &&
                 el.offsetHeight > 0 && 
                 el.offsetWidth > 0;
        };
        
        const visibleLoaders = Array.from(document.querySelectorAll(loaderSelectors.join(',')))
          .filter(isVisible);
          
        const noLoaders = visibleLoaders.length === 0;
        
        // Key UI Markers
        const keyElementsSelectors = [
          'table', 'button:not([disabled])', 'main', 'nav', 
          '.main', '#main', '.container', '[role="main"]', 
          'form', 'h1', '.dashboard', '[data-testid]'
        ];
        
        const hasKeyElement = keyElementsSelectors.some(selector => {
          const element = document.querySelector(selector);
          return element && element.offsetHeight > 0;
        });
        
        return { 
          url, 
          nodeCount, 
          textLength,
          hasContent: textLength > minLength, 
          noLoaders, 
          hasKeyElement, 
          loaderCount: visibleLoaders.length 
        };
      }, minContentLength);
      
      // 2. Network Idle Signal
      const now = Date.now();
      const networkIdle = activeRequests === 0 && (now - lastRequestTime) >= networkIdlePeriod;
      
      // 3. Stability Logic (URL + DOM)
      const isIdenticalToPrevious = 
        currentState.url === previousState.url &&
        currentState.nodeCount === previousState.nodeCount &&
        currentState.textLength === previousState.textLength;

      if (isIdenticalToPrevious && currentState.hasContent) {
        stabilityCount++;
      } else {
        // If anything changed, reset stability counter
        stabilityCount = 0;
      }

      // Update previous state for next check
      previousState = {
        url: currentState.url,
        nodeCount: currentState.nodeCount,
        textLength: currentState.textLength
      };

      // 4. Final Readiness Decision
      const isStable = stabilityCount >= stabilityThreshold;
      const isReady = isStable && currentState.noLoaders && networkIdle && currentState.hasKeyElement;
      
      if (isReady) {
        console.log('\n✅ Page has settled (Stable URL & DOM, Network Idle, No Loaders).');
        return { success: true, status: 'Ready' };
      }
      
      // Progress reporting
      const timeRemaining = Math.max(0, Math.round((timeout - (Date.now() - startTime))/1000));
      process.stdout.write(`\r⏳ Stabilizing... (${timeRemaining}s left) [Stability: ${stabilityCount}/${stabilityThreshold}] [NetIdle: ${networkIdle}] [NoLoaders: ${currentState.noLoaders}]\x1B[K`);
      
      await new Promise(resolve => setTimeout(resolve, checkInterval));
    }
    
    console.log('\n⚠️ Stability detection timed out. Proceeding with scan anyway.');
    return { success: false, status: 'Partial Scan - Page Still Loading/Unstable' };
  } catch (error) {
    console.error(`\n❌ Error during readiness detection: ${error.message}`);
    return { success: false, status: `Error: ${error.message}` };
  } finally {
    // Cleanup listeners
    page.off('request', onRequest);
    page.off('requestfinished', onRequestEnd);
    page.off('requestfailed', onRequestEnd);
  }
}
