import { StepResult, TestCase, TestResult, TestStep } from '@ai-testing-agent/core';
import { Browser, BrowserContext, Page, chromium, firefox, webkit } from 'playwright';
import { TestResultHandler } from './test-result-handler.js';
import { BrowserConfig, ExecutionOptions } from './types.js';

export class PlaywrightExecutor {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private resultHandler: TestResultHandler;

  constructor(private config: BrowserConfig = {}) {
    this.resultHandler = new TestResultHandler();
  }

  /**
   * Initialize the browser instance
   */
  async initialize(): Promise<void> {
    const browserType = this.config.browser || 'chromium';
    const headless = this.config.headless !== false; // Default to true

    switch (browserType) {
      case 'chromium':
        this.browser = await chromium.launch({ 
          headless,
          args: this.config.args || []
        });
        break;
      case 'firefox':
        this.browser = await firefox.launch({ 
          headless,
          args: this.config.args || []
        });
        break;
      case 'webkit':
        this.browser = await webkit.launch({ 
          headless,
          args: this.config.args || []
        });
        break;
      default:
        throw new Error(`Unsupported browser type: ${browserType}`);
    }

    // Create browser context with configuration
    const contextOptions: any = {
      viewport: this.config.viewport || { width: 1280, height: 720 },
      ignoreHTTPSErrors: this.config.ignoreHTTPSErrors || false,
      ...this.config.contextOptions
    };
    
    if (this.config.recordVideo) {
      contextOptions.recordVideo = { dir: './test-results/videos' };
    }
    
    this.context = await this.browser.newContext(contextOptions);

    // Create a new page
    this.page = await this.context.newPage();

    // Set default timeout
    this.page.setDefaultTimeout(this.config.timeout || 30000);
  }

  /**
   * Execute a single test case
   */
  async executeTestCase(testCase: TestCase, options: ExecutionOptions = {}): Promise<TestResult> {
    if (!this.page) {
      throw new Error('Browser not initialized. Call initialize() first.');
    }

    const startTime = Date.now();
    let stepResults: StepResult[] = [];
    let error: string | undefined;
    let status: 'PASSED' | 'FAILED' | 'FLAKY' | 'SKIPPED' = 'PASSED';

    try {
      // Execute each test step
      for (const step of testCase.steps) {
        const stepResult = await this.executeStep(step, testCase.testData);
        stepResults.push(stepResult);

        if (stepResult.status === 'FAILED') {
          status = 'FAILED';
          error = stepResult.error;
          break;
        }
      }
    } catch (err) {
      status = 'FAILED';
      error = err instanceof Error ? err.message : 'Unknown error occurred';
    }

    const duration = Date.now() - startTime;

    // Capture artifacts if test failed or if requested
    const artifacts = await this.captureArtifacts(testCase.id, status === 'FAILED' || options.captureOnSuccess);

    const result: TestResult = {
      testCaseId: testCase.id,
      status,
      duration,
      stepResults,
      artifacts,
      executedAt: new Date()
    };
    
    if (error) {
      (result as any).error = error;
    }

    return this.resultHandler.processResult(result);
  }

  /**
   * Execute a single test step
   */
  private async executeStep(step: TestStep, testData: Record<string, any>): Promise<StepResult> {
    const startTime = Date.now();
    let status: 'PASSED' | 'FAILED' | 'SKIPPED' = 'PASSED';
    let error: string | undefined;

    try {
      await this.performAction(step, testData);
    } catch (err) {
      status = 'FAILED';
      error = err instanceof Error ? err.message : 'Step execution failed';
    }

    const stepResult: StepResult = {
      step: step.step,
      status,
      duration: Date.now() - startTime
    };
    
    if (error) {
      (stepResult as any).error = error;
    }
    
    return stepResult;
  }

  /**
   * Perform the action specified in a test step
   */
  private async performAction(step: TestStep, testData: Record<string, any>): Promise<void> {
    if (!this.page) {
      throw new Error('Page not available');
    }

    const { action, element, data } = step;
    const mergedData = { ...testData, ...data };

    switch (action) {
      case 'navigate':
        await this.page.goto(this.resolveValue(step.expected, mergedData));
        break;

      case 'click':
        if (!element) throw new Error('Element selector required for click action');
        await this.page.click(element);
        break;

      case 'fill':
        if (!element) throw new Error('Element selector required for fill action');
        const value = this.resolveValue(step.expected, mergedData);
        await this.page.fill(element, value);
        break;

      case 'type':
        if (!element) throw new Error('Element selector required for type action');
        const text = this.resolveValue(step.expected, mergedData);
        await this.page.type(element, text);
        break;

      case 'select':
        if (!element) throw new Error('Element selector required for select action');
        const option = this.resolveValue(step.expected, mergedData);
        await this.page.selectOption(element, option);
        break;

      case 'wait':
        const waitTime = parseInt(this.resolveValue(step.expected, mergedData));
        await this.page.waitForTimeout(waitTime);
        break;

      case 'waitForElement':
        if (!element) throw new Error('Element selector required for waitForElement action');
        await this.page.waitForSelector(element);
        break;

      case 'waitForNavigation':
        await this.page.waitForLoadState('networkidle');
        break;

      case 'assert':
        await this.performAssertion(step, mergedData);
        break;

      case 'scroll':
        if (element) {
          await this.page.locator(element).scrollIntoViewIfNeeded();
        } else {
          await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        }
        break;

      case 'hover':
        if (!element) throw new Error('Element selector required for hover action');
        await this.page.hover(element);
        break;

      case 'keyPress':
        const key = this.resolveValue(step.expected, mergedData);
        await this.page.keyboard.press(key);
        break;

      default:
        throw new Error(`Unsupported action: ${action}`);
    }
  }

  /**
   * Perform assertion based on step configuration
   */
  private async performAssertion(step: TestStep, testData: Record<string, any>): Promise<void> {
    if (!this.page) {
      throw new Error('Page not available');
    }

    const { element, expected } = step;
    const expectedValue = this.resolveValue(expected, testData);

    if (element) {
      // Element-based assertion
      const locator = this.page.locator(element);
      
      if (expectedValue === 'visible') {
        await locator.waitFor({ state: 'visible' });
      } else if (expectedValue === 'hidden') {
        await locator.waitFor({ state: 'hidden' });
      } else {
        // Text content assertion
        await locator.waitFor();
        const actualText = await locator.textContent();
        if (actualText?.trim() !== expectedValue) {
          throw new Error(`Expected "${expectedValue}" but got "${actualText}"`);
        }
      }
    } else {
      // URL or title assertion
      if (expectedValue.startsWith('url:')) {
        const expectedUrl = expectedValue.replace('url:', '');
        const currentUrl = this.page.url();
        if (!currentUrl.includes(expectedUrl)) {
          throw new Error(`Expected URL to contain "${expectedUrl}" but got "${currentUrl}"`);
        }
      } else if (expectedValue.startsWith('title:')) {
        const expectedTitle = expectedValue.replace('title:', '');
        const actualTitle = await this.page.title();
        if (!actualTitle.includes(expectedTitle)) {
          throw new Error(`Expected title to contain "${expectedTitle}" but got "${actualTitle}"`);
        }
      }
    }
  }

  /**
   * Resolve dynamic values in test data
   */
  private resolveValue(value: string, data: Record<string, any>): string {
    return value.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] !== undefined ? String(data[key]) : match;
    });
  }

  /**
   * Capture test artifacts (screenshots, videos, logs)
   */
  private async captureArtifacts(testCaseId: string, capture: boolean = true): Promise<any> {
    if (!capture || !this.page) {
      return {};
    }

    const artifacts: any = {};

    try {
      // Capture screenshot
      const screenshotPath = `./test-results/screenshots/${testCaseId}-${Date.now()}.png`;
      await this.page.screenshot({ path: screenshotPath, fullPage: true });
      artifacts.screenshot = screenshotPath;

      // Capture console logs
      const logs = await this.page.evaluate(() => {
        return (window as any).testLogs || [];
      });
      artifacts.logs = logs;

    } catch (err) {
      console.warn('Failed to capture artifacts:', err);
    }

    return artifacts;
  }

  /**
   * Execute multiple test cases in sequence
   */
  async executeTestSuite(testCases: TestCase[], options: ExecutionOptions = {}): Promise<TestResult[]> {
    const results: TestResult[] = [];

    for (const testCase of testCases) {
      try {
        const result = await this.executeTestCase(testCase, options);
        results.push(result);
        
        // Stop on first failure if configured
        if (result.status === 'FAILED' && options.stopOnFailure) {
          break;
        }
      } catch (err) {
        console.error(`Failed to execute test case ${testCase.id}:`, err);
        results.push({
          testCaseId: testCase.id,
          status: 'FAILED',
          duration: 0,
          error: err instanceof Error ? err.message : 'Test execution failed',
          executedAt: new Date()
        });
      }

      // Add delay between tests if configured
      if (options.delayBetweenTests) {
        await this.page?.waitForTimeout(options.delayBetweenTests);
      }
    }

    return results;
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    try {
      if (this.page) {
        await this.page.close();
        this.page = null;
      }
      if (this.context) {
        await this.context.close();
        this.context = null;
      }
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }
    } catch (err) {
      console.error('Error during cleanup:', err);
    }
  }

  /**
   * Get current page instance
   */
  getPage(): Page | null {
    return this.page;
  }

  /**
   * Get current browser context
   */
  getContext(): BrowserContext | null {
    return this.context;
  }

  /**
   * Get current browser instance
   */
  getBrowser(): Browser | null {
    return this.browser;
  }
}
