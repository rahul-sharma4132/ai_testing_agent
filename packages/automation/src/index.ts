// Export main classes
export { BrowserUtils } from './browser-utils.js';
export { PlaywrightExecutor } from './playwright-executor.js';
export { TestResultHandler } from './test-result-handler.js';

// Export types and interfaces
export type {
    BrowserConfig, ElementOptions, ExecutionContext, ExecutionOptions, PerformanceMetrics, TestDataProvider, TestExecutionEvents, TestSummary, UtilsConfig
} from './types.js';

// Re-export core types for convenience
export type {
    StepResult, TestCase, TestResult, TestStep
} from '@ai-testing-agent/core';

// Export convenience factory functions
import { BrowserUtils } from './browser-utils.js';
import { PlaywrightExecutor } from './playwright-executor.js';
import { TestResultHandler } from './test-result-handler.js';
import { BrowserConfig, ExecutionOptions, TestExecutionEvents, UtilsConfig } from './types.js';

/**
 * Factory function to create a configured Playwright executor
 */
export function createExecutor(config: BrowserConfig = {}): PlaywrightExecutor {
  return new PlaywrightExecutor(config);
}

/**
 * Factory function to create browser utilities with configuration
 */
export function createBrowserUtils(config: UtilsConfig = {}): BrowserUtils {
  return new BrowserUtils(config);
}

/**
 * Factory function to create test result handler with event listeners
 */
export function createResultHandler(events: TestExecutionEvents = {}): TestResultHandler {
  return new TestResultHandler(events);
}

/**
 * Automation package version
 */
export const VERSION = '1.0.0';

/**
 * Default browser configuration
 */
export const DEFAULT_BROWSER_CONFIG: BrowserConfig = {
  browser: 'chromium',
  headless: true,
  timeout: 30000,
  viewport: {
    width: 1280,
    height: 720
  },
  ignoreHTTPSErrors: false
};

/**
 * Default execution options
 */
export const DEFAULT_EXECUTION_OPTIONS: ExecutionOptions = {
  captureOnSuccess: false,
  stopOnFailure: false,
  delayBetweenTests: 0,
  maxRetries: 0,
  parallel: {
    enabled: false,
    workers: 1
  }
};

/**
 * Default utilities configuration
 */
export const DEFAULT_UTILS_CONFIG: UtilsConfig = {
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
  }
};

/**
 * Main automation class that orchestrates test execution
 */
export class AutomationEngine {
  private executor: PlaywrightExecutor;
  private utils: BrowserUtils;
  private resultHandler: TestResultHandler;

  constructor(
    browserConfig: BrowserConfig = DEFAULT_BROWSER_CONFIG,
    utilsConfig: UtilsConfig = DEFAULT_UTILS_CONFIG,
    events: TestExecutionEvents = {}
  ) {
    this.executor = new PlaywrightExecutor(browserConfig);
    this.utils = new BrowserUtils(utilsConfig);
    this.resultHandler = new TestResultHandler(events);
  }

  /**
   * Initialize the automation engine
   */
  async initialize(): Promise<void> {
    await this.executor.initialize();
  }

  /**
   * Get the Playwright executor
   */
  getExecutor(): PlaywrightExecutor {
    return this.executor;
  }

  /**
   * Get the browser utilities
   */
  getUtils(): BrowserUtils {
    return this.utils;
  }

  /**
   * Get the result handler
   */
  getResultHandler(): TestResultHandler {
    return this.resultHandler;
  }

  /**
   * Execute a single test case with full automation capabilities
   */
  async executeTest(testCase: any, options: ExecutionOptions = DEFAULT_EXECUTION_OPTIONS) {
    const result = await this.executor.executeTestCase(testCase, options);
    return this.resultHandler.processResult(result);
  }

  /**
   * Execute multiple test cases
   */
  async executeTestSuite(testCases: any[], options: ExecutionOptions = DEFAULT_EXECUTION_OPTIONS) {
    const results = await this.executor.executeTestSuite(testCases, options);
    results.forEach(result => this.resultHandler.processResult(result));
    return results;
  }

  /**
   * Generate comprehensive test report
   */
  async generateReport(format: 'json' | 'html' | 'junit' = 'html', filePath?: string) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const defaultPath = `./test-results/report-${timestamp}.${format}`;
    const outputPath = filePath || defaultPath;

    switch (format) {
      case 'json':
        await this.resultHandler.exportToJson(outputPath);
        break;
      case 'html':
        await this.resultHandler.exportToHtml(outputPath);
        break;
      case 'junit':
        await this.resultHandler.exportToJunit(outputPath);
        break;
    }

    return outputPath;
  }

  /**
   * Get test execution summary
   */
  getSummary() {
    return this.resultHandler.generateSummary();
  }

  /**
   * Get failure analysis
   */
  getFailureAnalysis() {
    return this.resultHandler.getFailureAnalysis();
  }

  /**
   * Get performance metrics summary
   */
  getPerformanceSummary() {
    return this.resultHandler.getPerformanceSummary();
  }

  /**
   * Clean up all resources
   */
  async cleanup(): Promise<void> {
    await this.executor.cleanup();
  }
}

/**
 * Create a fully configured automation engine
 */
export function createAutomationEngine(
  browserConfig?: BrowserConfig,
  utilsConfig?: UtilsConfig,
  events?: TestExecutionEvents
): AutomationEngine {
  return new AutomationEngine(browserConfig, utilsConfig, events);
}


