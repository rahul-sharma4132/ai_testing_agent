import { ElementHandle, Locator, Page } from 'playwright';
import { ElementOptions, PerformanceMetrics, UtilsConfig } from './types.js';

export class BrowserUtils {
  private config: UtilsConfig;

  constructor(config: UtilsConfig = {}) {
    this.config = {
      defaultWaitTimeout: 30000,
      retryConfig: {
        maxRetries: 3,
        delay: 1000,
        backoff: 'exponential'
      },
      screenshots: {
        onFailure: true,
        onSuccess: false,
        fullPage: true
      },
      ...config
    };
  }

  /**
   * Wait for element with retry logic
   */
  async waitForElement(
    page: Page, 
    selector: string, 
    options: ElementOptions = {}
  ): Promise<Locator> {
    const timeout = options.timeout || this.config.defaultWaitTimeout;
    const locator = page.locator(selector);

    await this.retryOperation(async () => {
      const waitOptions: any = {
        state: options.waitForVisible ? 'visible' : 'attached'
      };
      if (timeout !== undefined) {
        waitOptions.timeout = timeout;
      }
      await locator.waitFor(waitOptions);
    });

    return locator;
  }

  /**
   * Smart click with various fallback strategies
   */
  async smartClick(
    page: Page, 
    selector: string, 
    options: ElementOptions = {}
  ): Promise<void> {
    const locator = await this.waitForElement(page, selector, options);

    await this.retryOperation(async () => {
      try {
        // Try normal click first
        const clickOptions: any = {
          timeout: options.timeout || this.config.defaultWaitTimeout
        };
        if (options.force !== undefined) clickOptions.force = options.force;
        if (options.position !== undefined) clickOptions.position = options.position;
        
        await locator.click(clickOptions);
      } catch (error) {
        // Fallback strategies
        console.warn(`Normal click failed for ${selector}, trying alternatives...`);
        
        // Try scrolling into view first
        await locator.scrollIntoViewIfNeeded();
        await page.waitForTimeout(500);
        
        try {
          await locator.click({ force: true });
        } catch (secondError) {
          // Use JavaScript click as last resort
          await this.jsClick(page, selector);
        }
      }
    });
  }

  /**
   * JavaScript-based click
   */
  private async jsClick(page: Page, selector: string): Promise<void> {
    await page.evaluate((sel) => {
      const element = document.querySelector(sel) as HTMLElement;
      if (element) {
        element.click();
      } else {
        throw new Error(`Element not found: ${sel}`);
      }
    }, selector);
  }

  /**
   * Smart text input with clearing and validation
   */
  async smartFill(
    page: Page, 
    selector: string, 
    text: string, 
    options: ElementOptions = {}
  ): Promise<void> {
    const locator = await this.waitForElement(page, selector, options);

    await this.retryOperation(async () => {
      // Clear existing content
      await locator.clear();
      await page.waitForTimeout(100);
      
      // Fill with new text
      await locator.fill(text);
      
      // Validate the input
      const actualValue = await locator.inputValue();
      if (actualValue !== text) {
        throw new Error(`Text input validation failed. Expected: "${text}", Actual: "${actualValue}"`);
      }
    });
  }

  /**
   * Wait for multiple elements to be present
   */
  async waitForElements(
    page: Page, 
    selectors: string[], 
    options: ElementOptions = {}
  ): Promise<Locator[]> {
    const promises = selectors.map(selector => 
      this.waitForElement(page, selector, options)
    );
    return Promise.all(promises);
  }

  /**
   * Get element text with fallback strategies
   */
  async getElementText(
    page: Page, 
    selector: string, 
    options: ElementOptions = {}
  ): Promise<string> {
    const locator = await this.waitForElement(page, selector, options);
    
    return this.retryOperation(async () => {
      let text = await locator.textContent();
      if (!text || text.trim() === '') {
        // Try innerText as fallback
        text = await locator.innerText();
      }
      if (!text || text.trim() === '') {
        // Try input value for form elements
        text = await locator.inputValue().catch(() => '');
      }
      return text?.trim() || '';
    });
  }

  /**
   * Check if element exists without waiting
   */
  async elementExists(page: Page, selector: string): Promise<boolean> {
    try {
      const locator = page.locator(selector);
      await locator.waitFor({ state: 'attached', timeout: 1000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Wait for element to disappear
   */
  async waitForElementToDisappear(
    page: Page, 
    selector: string, 
    timeout: number = 10000
  ): Promise<void> {
    const locator = page.locator(selector);
    await locator.waitFor({ state: 'detached', timeout });
  }

  /**
   * Get all elements matching a selector
   */
  async getAllElements(
    page: Page, 
    selector: string, 
    options: ElementOptions = {}
  ): Promise<Locator[]> {
    await this.waitForElement(page, selector, options);
    const locator = page.locator(selector);
    const count = await locator.count();
    
    const elements: Locator[] = [];
    for (let i = 0; i < count; i++) {
      elements.push(locator.nth(i));
    }
    
    return elements;
  }

  /**
   * Hover over element with retry
   */
  async smartHover(
    page: Page, 
    selector: string, 
    options: ElementOptions = {}
  ): Promise<void> {
    const locator = await this.waitForElement(page, selector, options);
    
    await this.retryOperation(async () => {
      await locator.scrollIntoViewIfNeeded();
      await locator.hover();
    });
  }

  /**
   * Select dropdown option with multiple strategies
   */
  async smartSelect(
    page: Page, 
    selector: string, 
    value: string | string[], 
    options: ElementOptions = {}
  ): Promise<void> {
    const locator = await this.waitForElement(page, selector, options);
    
    await this.retryOperation(async () => {
      try {
        // Try by value first
        await locator.selectOption(value);
      } catch (error) {
        // Try by label
        const selectElement = await locator.elementHandle();
        if (selectElement) {
          await this.selectByLabel(page, selectElement, Array.isArray(value) ? value[0] : value);
        }
      }
    });
  }

  /**
   * Select dropdown option by visible text
   */
  private async selectByLabel(page: Page, selectElement: ElementHandle, label: string): Promise<void> {
    await page.evaluate(
      ([select, labelText]) => {
        const selectEl = select as HTMLSelectElement;
        const options = Array.from(selectEl.options);
        const option = options.find(opt => opt.text.trim() === labelText);
        if (option) {
          selectEl.value = option.value;
          selectEl.dispatchEvent(new Event('change', { bubbles: true }));
        } else {
          throw new Error(`Option with label "${labelText}" not found`);
        }
      },
      [selectElement, label] as const
    );
  }

  /**
   * Drag and drop operation
   */
  async dragAndDrop(
    page: Page, 
    sourceSelector: string, 
    targetSelector: string,
    options: ElementOptions = {}
  ): Promise<void> {
    const sourceLocator = await this.waitForElement(page, sourceSelector, options);
    const targetLocator = await this.waitForElement(page, targetSelector, options);
    
    await this.retryOperation(async () => {
      await sourceLocator.dragTo(targetLocator);
    });
  }

  /**
   * Upload file to input element
   */
  async uploadFile(
    page: Page, 
    selector: string, 
    filePaths: string | string[],
    options: ElementOptions = {}
  ): Promise<void> {
    const locator = await this.waitForElement(page, selector, options);
    
    await this.retryOperation(async () => {
      await locator.setInputFiles(filePaths);
    });
  }

  /**
   * Take screenshot with options
   */
  async takeScreenshot(
    page: Page, 
    selector?: string, 
    filename?: string
  ): Promise<Buffer | string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const defaultFilename = `screenshot-${timestamp}.png`;
    
    if (selector) {
      const locator = page.locator(selector);
      return await locator.screenshot({
        path: filename || defaultFilename,
        type: 'png'
      });
    } else {
      return await page.screenshot({
        path: filename || defaultFilename,
        fullPage: this.config.screenshots?.fullPage || true,
        type: 'png'
      });
    }
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(page: Page): Promise<PerformanceMetrics> {
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const resources = performance.getEntriesByType('resource');
      
      return {
        navigation: {
          loadStart: navigation.loadEventStart,
          loadEnd: navigation.loadEventEnd,
          domContentLoaded: navigation.domContentLoadedEventEnd,
          domComplete: navigation.domComplete
        },
        resources: resources.map(resource => ({
          name: resource.name,
          startTime: resource.startTime,
          endTime: resource.startTime + resource.duration,
          transferSize: (resource as any).transferSize || 0
        }))
      };
    });

    // Get Core Web Vitals if available
    const coreWebVitals = await page.evaluate(() => {
      return new Promise((resolve) => {
        const vitals: any = {};
        
        // Try to get LCP
        if ('LargestContentfulPaint' in window) {
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            if (entries.length > 0) {
              vitals.lcp = entries[entries.length - 1].startTime;
            }
          }).observe({ entryTypes: ['largest-contentful-paint'] });
        }
        
        // Try to get FID
        if ('FirstInputDelay' in window) {
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            if (entries.length > 0) {
              const entry = entries[0] as any;
              vitals.fid = entry.processingStart - entry.startTime;
            }
          }).observe({ entryTypes: ['first-input'] });
        }
        
        // Try to get CLS
        if ('LayoutShift' in window) {
          let clsValue = 0;
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (!(entry as any).hadRecentInput) {
                clsValue += (entry as any).value;
              }
            }
            vitals.cls = clsValue;
          }).observe({ entryTypes: ['layout-shift'] });
        }
        
        // Return after a short delay to allow metrics to be collected
        setTimeout(() => resolve(vitals), 1000);
      });
    });

    return {
      ...metrics,
      coreWebVitals: coreWebVitals as any
    };
  }

  /**
   * Wait for network to be idle
   */
  async waitForNetworkIdle(page: Page, timeout: number = 30000): Promise<void> {
    await page.waitForLoadState('networkidle', { timeout });
  }

  /**
   * Retry operation with configurable backoff
   */
  private async retryOperation<T>(
    operation: () => Promise<T>, 
    retryConfig = this.config.retryConfig
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= retryConfig!.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === retryConfig!.maxRetries) {
          throw lastError;
        }
        
        const delay = retryConfig!.backoff === 'exponential' 
          ? retryConfig!.delay * Math.pow(2, attempt)
          : retryConfig!.delay;
          
        console.warn(`Operation failed (attempt ${attempt + 1}), retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError!;
  }

  /**
   * Execute JavaScript in page context
   */
  async executeScript<T>(page: Page, script: string | Function, ...args: any[]): Promise<T> {
    return await page.evaluate(script as any, ...args);
  }

  /**
   * Get element attribute
   */
  async getElementAttribute(
    page: Page, 
    selector: string, 
    attribute: string,
    options: ElementOptions = {}
  ): Promise<string | null> {
    const locator = await this.waitForElement(page, selector, options);
    return await locator.getAttribute(attribute);
  }

  /**
   * Check if element is visible
   */
  async isElementVisible(page: Page, selector: string): Promise<boolean> {
    try {
      const locator = page.locator(selector);
      return await locator.isVisible();
    } catch {
      return false;
    }
  }

  /**
   * Check if element is enabled
   */
  async isElementEnabled(page: Page, selector: string): Promise<boolean> {
    try {
      const locator = page.locator(selector);
      return await locator.isEnabled();
    } catch {
      return false;
    }
  }
}
