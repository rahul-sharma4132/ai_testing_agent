import { BrowserContextOptions } from 'playwright';

/**
 * Browser configuration options
 */
export interface BrowserConfig {
  /** Browser type to use */
  browser?: 'chromium' | 'firefox' | 'webkit';
  
  /** Run in headless mode */
  headless?: boolean;
  
  /** Browser launch arguments */
  args?: string[];
  
  /** Default timeout for operations */
  timeout?: number;
  
  /** Viewport size */
  viewport?: {
    width: number;
    height: number;
  };
  
  /** Ignore HTTPS errors */
  ignoreHTTPSErrors?: boolean;
  
  /** Record video during test execution */
  recordVideo?: {
    dir: string;
    size?: {
      width: number;
      height: number;
    };
  };
  
  /** Additional browser context options */
  contextOptions?: Partial<BrowserContextOptions>;
}

/**
 * Test execution options
 */
export interface ExecutionOptions {
  /** Capture artifacts on successful tests */
  captureOnSuccess?: boolean;
  
  /** Stop execution on first failure */
  stopOnFailure?: boolean;
  
  /** Delay between test cases in milliseconds */
  delayBetweenTests?: number;
  
  /** Maximum retries for failed tests */
  maxRetries?: number;
  
  /** Parallel execution settings */
  parallel?: {
    enabled: boolean;
    workers?: number;
  };
}

/**
 * Test execution context
 */
export interface ExecutionContext {
  /** Test environment variables */
  environment: Record<string, string>;
  
  /** Base URL for the application under test */
  baseUrl?: string;
  
  /** Authentication credentials */
  auth?: {
    username: string;
    password: string;
    type: 'basic' | 'form' | 'oauth';
  };
  
  /** Database connection for test data setup */
  database?: {
    connectionString: string;
    type: 'mysql' | 'postgresql' | 'sqlite';
  };
}

/**
 * Browser automation utilities configuration
 */
export interface UtilsConfig {
  /** Default wait timeout for elements */
  defaultWaitTimeout?: number;
  
  /** Retry configuration for failed operations */
  retryConfig?: {
    maxRetries: number;
    delay: number;
    backoff: 'linear' | 'exponential';
  };
  
  /** Screenshot configuration */
  screenshots?: {
    onFailure: boolean;
    onSuccess: boolean;
    fullPage: boolean;
    quality?: number;
  };
}

/**
 * Element interaction options
 */
export interface ElementOptions {
  /** Wait for element to be visible before interaction */
  waitForVisible?: boolean;
  
  /** Wait for element to be enabled before interaction */
  waitForEnabled?: boolean;
  
  /** Timeout for element operations */
  timeout?: number;
  
  /** Force the action even if element is not actionable */
  force?: boolean;
  
  /** Position for click actions */
  position?: {
    x: number;
    y: number;
  };
}

/**
 * Test data management
 */
export interface TestDataProvider {
  /** Get test data by key */
  getData(key: string): Promise<any>;
  
  /** Set test data */
  setData(key: string, value: any): Promise<void>;
  
  /** Clear all test data */
  clearData(): Promise<void>;
  
  /** Load test data from file */
  loadFromFile(filePath: string): Promise<void>;
}

/**
 * Test result summary
 */
export interface TestSummary {
  /** Total number of tests executed */
  total: number;
  
  /** Number of passed tests */
  passed: number;
  
  /** Number of failed tests */
  failed: number;
  
  /** Number of skipped tests */
  skipped: number;
  
  /** Number of flaky tests */
  flaky: number;
  
  /** Total execution time */
  duration: number;
  
  /** Start time */
  startTime: Date;
  
  /** End time */
  endTime: Date;
  
  /** Environment information */
  environment: {
    browser: string;
    version: string;
    platform: string;
  };
}

/**
 * Test execution events
 */
export interface TestExecutionEvents {
  /** Fired when test execution starts */
  onTestStart?: (testId: string) => void;
  
  /** Fired when test execution completes */
  onTestComplete?: (testId: string, result: any) => void;
  
  /** Fired when test fails */
  onTestFailure?: (testId: string, error: string) => void;
  
  /** Fired when test suite starts */
  onSuiteStart?: (suiteId: string) => void;
  
  /** Fired when test suite completes */
  onSuiteComplete?: (suiteId: string, summary: TestSummary) => void;
}

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  /** Navigation timing */
  navigation: {
    loadStart: number;
    loadEnd: number;
    domContentLoaded: number;
    domComplete: number;
  };
  
  /** Resource loading times */
  resources: Array<{
    name: string;
    startTime: number;
    endTime: number;
    transferSize: number;
  }>;
  
  /** Core Web Vitals */
  coreWebVitals: {
    lcp?: number; // Largest Contentful Paint
    fid?: number; // First Input Delay
    cls?: number; // Cumulative Layout Shift
  };
}


