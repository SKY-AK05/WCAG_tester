import { chromium } from 'playwright';
import { waitForPageReady } from '../utils/waitUtils.js';

/**
 * Auth Agent - Handles authentication detection and login automation
 */
class AuthAgent {
  constructor() {
    this.browser = null;
    this.context = null;
    this.page = null;
    this.session = null;
  }

  async initialize() {
    this.browser = await chromium.launch({ headless: true });
    this.context = await this.browser.newContext({
      viewport: { width: 1280, height: 720 },
      bypassCSP: true
    });
    this.page = await this.context.newPage();
  }

  /**
   * Detect if page requires authentication
   */
  async detectAuthRequired(url) {
    await this.page.goto(url, { waitUntil: 'networkidle' });
    
    // Wait a bit more for potential redirects
    await this.page.waitForTimeout(3000);
    
    const authDetection = await this.page.evaluate(() => {
      // Check current URL for authentication indicators
      const currentUrl = window.location.href.toLowerCase();
      const isAuthUrl = currentUrl.includes('/login') || 
                       currentUrl.includes('/signin') || 
                       currentUrl.includes('/auth') ||
                       currentUrl.includes('/saml') ||
                       currentUrl.includes('/oauth');
      
      console.log('🔍 Auth Detection - Current URL:', currentUrl);
      console.log('🔍 Auth Detection - Is Auth URL:', isAuthUrl);
      
      // Look for login form indicators
      const loginIndicators = [
        'input[type="password"]',
        'input[name*="password"]',
        'input[id*="password"]',
        'input[autocomplete="current-password"]',
        '[data-testid*="login"]',
        '[data-testid*="signin"]',
        'form[action*="login"]',
        'form[action*="signin"]',
        '.login-form',
        '.signin-form',
        '#login-form',
        '#signin-form'
      ];

      const hasPasswordField = loginIndicators.some(selector => 
        document.querySelector(selector)
      );

      // Check for login-related keywords in page content
      const pageText = document.body.innerText.toLowerCase();
      const loginKeywords = [
        'sign in', 'login', 'log in', 'sign in to', 'login to',
        'email address', 'password', 'username', 'credentials',
        'unauthorized', 'access denied', 'authentication required',
        'please log in', 'you must be logged in', 'sign in to continue'
      ];

      const hasLoginKeywords = loginKeywords.some(keyword => 
        pageText.includes(keyword)
      );

      // Check for authentication error messages
      const authErrorKeywords = [
        'unauthorized', 'access denied', 'authentication required',
        'please log in', 'you must be logged in', 'sign in to continue',
        '401', '403', 'session expired', 'login required'
      ];

      const hasAuthError = authErrorKeywords.some(keyword => 
        pageText.includes(keyword)
      );

      // Check if already logged in (look for logout/profile indicators)
      const logoutIndicators = [
        '[data-testid*="logout"]',
        '[data-testid*="signout"]',
        'a[href*="logout"]',
        'a[href*="signout"]',
        '.logout',
        '.signout',
        '[aria-label*="logout"]',
        '[aria-label*="sign out"]'
      ];

      const hasLogoutElement = logoutIndicators.some(selector => 
        document.querySelector(selector)
      );

      // Also check for logout buttons by text content
      const logoutButtons = Array.from(document.querySelectorAll('button, a')).filter(el => 
        el.textContent?.toLowerCase().includes('logout') || 
        el.textContent?.toLowerCase().includes('sign out') ||
        el.textContent?.toLowerCase().includes('log out')
      );

      // Check for profile/dashboard indicators (logged in state)
      const profileIndicators = [
        '[data-testid*="profile"]',
        '[data-testid*="avatar"]',
        '.profile',
        '.user-menu',
        '.dashboard',
        'img[alt*="avatar"]',
        'img[alt*="profile"]',
        '.user-info',
        '.account'
      ];

      const hasProfileElement = profileIndicators.some(selector => 
        document.querySelector(selector)
      );

      // Enhanced logic: If we're on an auth URL OR have auth errors OR have login form, auth is required
      const requiresAuth = isAuthUrl || hasAuthError || (hasPasswordField && hasLoginKeywords);
      
      // But if we have logout/profile elements, we're already logged in
      const alreadyLoggedIn = hasLogoutElement || logoutButtons.length > 0 || hasProfileElement;

      console.log('🔍 Auth Detection Results:');
      console.log('- Has password field:', hasPasswordField);
      console.log('- Has login keywords:', hasLoginKeywords);
      console.log('- Has auth error:', hasAuthError);
      console.log('- Has logout element:', hasLogoutElement);
      console.log('- Logout buttons found:', logoutButtons.length);
      console.log('- Has profile element:', hasProfileElement);
      console.log('- Requires auth:', requiresAuth && !alreadyLoggedIn);

      return {
        requiresAuth: requiresAuth && !alreadyLoggedIn,
        hasPasswordField,
        hasLoginKeywords,
        hasLogoutElement: alreadyLoggedIn,
        hasProfileElement,
        isAuthUrl,
        hasAuthError,
        currentUrl: window.location.href
      };
    });

    return authDetection;
  }

  /**
   * Find login form and its fields
   */
  async findLoginForm() {
    return await this.page.evaluate(() => {
      // Helper function to get element selector
      function getElementSelector(element) {
        if (element.id) return `#${element.id}`;
        if (element.name) return `[name="${element.name}"]`;
        if (element.className) return `.${element.className.split(' ').join('.')}`;
        return element.tagName.toLowerCase();
      }

      // Find password field first
      const passwordField = document.querySelector('input[type="password"], input[name*="password"], input[id*="password"], input[autocomplete="current-password"]');
      
      if (!passwordField) return null;

      // Find the containing form
      let form = passwordField.closest('form');
      if (!form) {
        // If no form, look for common form containers
        form = passwordField.closest('.login-form, .signin-form, [data-testid*="login"], [data-testid*="signin"]');
      }

      if (!form) return null;

      // Find username/email field
      const usernameSelectors = [
        'input[type="email"]',
        'input[type="text"]',
        'input[name*="email"]',
        'input[name*="user"]',
        'input[name*="login"]',
        'input[id*="email"]',
        'input[id*="user"]',
        'input[id*="login"]',
        'input[autocomplete="username"]',
        'input[autocomplete="email"]'
      ];

      let usernameField = null;
      for (const selector of usernameSelectors) {
        const field = form.querySelector(selector);
        if (field && field !== passwordField) {
          usernameField = field;
          break;
        }
      }

      // Find submit button
      const submitSelectors = [
        'button[type="submit"]',
        'input[type="submit"]',
        '[data-testid*="submit"]',
        '[data-testid*="login"]',
        '[data-testid*="signin"]'
      ];

      let submitButton = null;
      for (const selector of submitSelectors) {
        const button = form.querySelector(selector) || document.querySelector(selector);
        if (button) {
          submitButton = button;
          break;
        }
      }

      // Also check for submit buttons by text content (Safe replacement for :has-text)
      if (!submitButton) {
        const buttons = Array.from(document.querySelectorAll('button, input[type="submit"], a.btn, .button'));
        submitButton = buttons.find(btn => {
          const text = (btn.textContent || btn.value || '').toLowerCase();
          return text.includes('sign') || 
                 text.includes('log') || 
                 text.includes('login') || 
                 text.includes('continue') ||
                 text.includes('submit');
        });
      }

      return {
        form: form.tagName.toLowerCase(),
        usernameField: usernameField ? {
          selector: getElementSelector(usernameField),
          type: usernameField.type || 'text',
          name: usernameField.name || '',
          id: usernameField.id || '',
          placeholder: usernameField.placeholder || '',
          autocomplete: usernameField.autocomplete || ''
        } : null,
        passwordField: {
          selector: getElementSelector(passwordField),
          type: passwordField.type,
          name: passwordField.name || '',
          id: passwordField.id || '',
          placeholder: passwordField.placeholder || '',
          autocomplete: passwordField.autocomplete || ''
        },
        submitButton: submitButton ? {
          selector: getElementSelector(submitButton),
          type: submitButton.tagName.toLowerCase(),
          text: submitButton.textContent?.trim() || submitButton.value || ''
        } : null
      };
    });
  }

  /**
   * Get unique selector for element
   */
  async getElementSelector(element) {
    if (element.id) return `#${element.id}`;
    if (element.name) return `[name="${element.name}"]`;
    if (element.className) return `.${element.className.split(' ').join('.')}`;
    
    // Generate path-based selector as fallback
    const path = [];
    let current = element;
    while (current && current !== document.body) {
      let selector = current.tagName.toLowerCase();
      if (current.className) {
        selector += `.${current.className.split(' ').join('.')}`;
      }
      path.unshift(selector);
      current = current.parentElement;
    }
    return path.join(' > ');
  }

  /**
   * Perform authentication
   */
  async authenticate(credentials) {
    try {
      const loginForm = await this.findLoginForm();
      
      if (!loginForm) {
        return { success: false, method: 'form', error: 'No login form detected' };
      }

      // Fill username field
      if (loginForm.usernameField && credentials.username) {
        await this.page.fill(loginForm.usernameField.selector, credentials.username);
        await this.page.waitForTimeout(500); // Small delay for React forms
      }

      // Fill password field
      if (loginForm.passwordField && credentials.password) {
        await this.page.fill(loginForm.passwordField.selector, credentials.password);
        await this.page.waitForTimeout(500);
      }

      // Handle multi-step login (e.g., email first, then password)
      if (loginForm.submitButton) {
        await this.page.click(loginForm.submitButton.selector);
        console.log('⏳ Waiting for login processing...');
        await waitForPageReady(this.page, { timeout: 15000 }); // Fast-pass for login redirect
        
        // Check if we need to enter password on next screen
        const stillOnLoginPage = await this.detectAuthRequired(this.page.url());
        if (stillOnLoginPage.requiresAuth && !loginForm.passwordField) {
          // Try to find password field on second screen
          const secondForm = await this.findLoginForm();
          if (secondForm && secondForm.passwordField && credentials.password) {
            await this.page.fill(secondForm.passwordField.selector, credentials.password);
            if (secondForm.submitButton) {
              await this.page.click(secondForm.submitButton.selector);
            }
          }
        }
      }

      // Wait for navigation and login completion
      console.log('⏳ Waiting for login completion...');
      await waitForPageReady(this.page, { timeout: 30000 });

      // Verify login success
      const loginSuccess = await this.verifyLoginSuccess();
      
      if (loginSuccess.success) {
        // Store session
        this.session = await this.context.cookies();
        return { 
          success: true, 
          method: 'form',
          session: this.session,
          postLoginUrl: this.page.url()
        };
      } else {
        return { 
          success: false, 
          method: 'form', 
          error: loginSuccess.error || 'Login verification failed' 
        };
      }

    } catch (error) {
      return { 
        success: false, 
        method: 'form', 
        error: `Authentication error: ${error.message}` 
      };
    }
  }

  /**
   * Verify if login was successful
   */
  async verifyLoginSuccess() {
    return await this.page.evaluate(() => {
      const currentUrl = window.location.href.toLowerCase();
      const pageText = document.body.innerText.toLowerCase();

      // 1. URL Change Signal (very strong in SPAs)
      const isLoginUrl = currentUrl.includes('/login') || 
                        currentUrl.includes('/signin') || 
                        currentUrl.includes('/auth');
      
      // 2. Logout/Signout Indicators (Manual text matching)
      const logoutSelectors = [
        '[data-testid*="logout"]', '[data-testid*="signout"]',
        'a[href*="logout"]', 'a[href*="signout"]',
        '.logout', '.signout', '[aria-label*="logout"]', '[aria-label*="sign out"]'
      ];
      
      const hasLogoutSelector = logoutSelectors.some(s => document.querySelector(s));
      
      const logoutKeywords = ['logout', 'sign out', 'log out', 'signoff', 'sign off'];
      const hasLogoutText = Array.from(document.querySelectorAll('button, a, span, div'))
        .filter(el => el.offsetWidth > 0 && el.offsetHeight > 0) // Visible only
        .some(el => {
          const text = (el.textContent || '').toLowerCase();
          return logoutKeywords.some(kw => text.includes(kw));
        });

      // 3. Profile/Dashboard Indicators
      const profileIndicators = [
        '[data-testid*="profile"]', '[data-testid*="avatar"]',
        '.profile', '.user-menu', '.dashboard', '.account',
        'img[alt*="avatar"]', 'img[alt*="profile"]',
        '#dashboard', '.main-content'
      ];
      const hasProfileElement = profileIndicators.some(s => document.querySelector(s));

      // 4. Error messages (Negative signal)
      const errorSelectors = ['.error', '.alert-error', '[data-testid*="error"]', '.login-error'];
      const hasError = errorSelectors.some(s => {
        const el = document.querySelector(s);
        return el && el.textContent.trim().length > 0 && el.offsetWidth > 0;
      });

      // Multi-signal decision
      const authFound = (hasLogoutSelector || hasLogoutText || hasProfileElement);
      const urlChanged = !isLoginUrl;
      
      // Success if we found auth indicators OR we are definitely off the login page AND no errors
      const success = (authFound || urlChanged) && !hasError;

      return {
        success,
        authFound,
        urlChanged,
        hasError,
        currentUrl
      };
    });
  }

  /**
   * Navigate to target URL after login
   */
  async navigateToTarget(targetUrl) {
    const currentUrl = this.page.url();
    // Normalize URLs by removing trailing slashes for comparison
    const normalizedTarget = targetUrl.replace(/\/$/, '').toLowerCase();
    const normalizedCurrent = currentUrl.replace(/\/$/, '').toLowerCase();

    if (normalizedCurrent === normalizedTarget) {
      console.log(`⚡ Already on target page: ${targetUrl} (skipping redundant load)`);
    } else {
      console.log(`🚀 Navigating from ${currentUrl} to ${targetUrl}`);
      // Navigate with extended wait time for slow-loading sites
      await this.page.goto(targetUrl, { 
        waitUntil: 'load', 
        timeout: 60000 // 60 second timeout
      });
    }
    
    // Use Smart Page Readiness Detection System
    const readiness = await waitForPageReady(this.page, { 
      timeout: 60000,
      networkIdlePeriod: 3000 // 3 seconds of idle for final target page
    });
    
    if (!readiness.success) {
      console.log(`⚠️ ${readiness.status}`);
    }
    
    console.log(`✅ Page loaded successfully: ${this.page.url()}`);
    return { 
      url: this.page.url(), 
      readiness 
    };
  }

  /**
   * Get page content for WCAG scanning
   */
  async getPageContent() {
    return await this.page.content();
  }

  /**
   * Get current page URL
   */
  getCurrentUrl() {
    return this.page.url();
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

export default AuthAgent;
