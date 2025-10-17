# AI Testing Agent - Automation Package

The Automation Package provides comprehensive test execution capabilities using Playwright for web application testing. It offers a high-level API for running automated tests, browser interactions, and result processing.

## Features

- **Playwright Integration**: Full support for Chromium, Firefox, and WebKit browsers
- **Smart Browser Utilities**: Robust element interactions with retry logic and fallback strategies
- **Test Result Management**: Comprehensive test reporting with multiple output formats
- **Flexible Configuration**: Extensive customization options for browser and execution settings
- **Performance Monitoring**: Built-in performance metrics collection and analysis
- **Artifact Collection**: Automatic screenshot, video, and trace capture on failures

## Installation

```bash
npm install @ai-testing-agent/automation
```

## Quick Start

### Basic Usage with AutomationEngine

```typescript
import { createAutomationEngine, BrowserConfig } from '@ai-testing-agent/automation';
import { TestCase } from '@ai-testing-agent/core';

// Create automation engine
const browserConfig: BrowserConfig = {
  browser: 'chromium',
  headless: false,
  viewport: { width: 1920, height: 1080 }
};

const engine = createAutomationEngine(browserConfig);

// Initialize and execute tests
async function runTests() {
  await engine.initialize();
  
  // Create a test case
  const testCase: TestCase = {
    id: 'login-test',
    moduleId: 'auth',
    title: 'User Login Flow',
    type: 'UI_WORKFLOW',
    priority: 'HIGH',
    steps: [
      {
        step: 1,
        action: 'navigate',
        expected: 'https://example.com/login',
        element: '',
        data: {}
      },
      {
        step: 2,
        action: 'fill',
        expected: '{{username}}',
        element: '#username',
        data: {}
      },
      {
        step: 3,
        action: 'fill',
        expected: '{{password}}',
        element: '#password',
        data: {}
      },
      {
        step: 4,
        action: 'click',
        expected: '',
        element: '#login-button',
        data: {}
      }
    ],
    testData: {
      username: 'test@example.com',
      password: 'password123'
    },
    expectedResults: ['User should be logged in'],
    dependencies: [],
    status: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  // Execute the test
  const result = await engine.executeTest(testCase);
  console.log('Test result:', result);
  
  // Generate reports
  await engine.generateReport('html', './reports/test-report.html');
  
  // Cleanup
  await engine.cleanup();
}
```

### Using Individual Components

```typescript
import { PlaywrightExecutor, BrowserUtils, TestResultHandler } from '@ai-testing-agent/automation';

// Create individual components
const executor = new PlaywrightExecutor({
  browser: 'chromium',
  headless: true
});

const utils = new BrowserUtils({
  defaultWaitTimeout: 30000,
  retryConfig: {
    maxRetries: 3,
    delay: 1000,
    backoff: 'exponential'
  }
});

const resultHandler = new TestResultHandler({
  onTestComplete: (testId, result) => {
    console.log(`Test ${testId} completed with status: ${result.status}`);
  }
});

// Use components
async function customAutomation() {
  await executor.initialize();
  const page = executor.getPage();
  
  if (page) {
    await page.goto('https://example.com');
    
    // Use smart utilities
    await utils.smartClick(page, '#submit-button');
    await utils.smartFill(page, '#input-field', 'test value');
    
    // Take screenshot
    await utils.takeScreenshot(page, undefined, './screenshot.png');
    
    // Get performance metrics
    const metrics = await utils.getPerformanceMetrics(page);
    console.log('Performance:', metrics);
  }
  
  await executor.cleanup();
}
```

## API Reference

### AutomationEngine

The main class that orchestrates test execution.

#### Constructor

```typescript
new AutomationEngine(
  browserConfig?: BrowserConfig,
  utilsConfig?: UtilsConfig,
  events?: TestExecutionEvents
)
```

#### Methods

- `initialize()`: Initialize the browser and automation environment
- `executeTest(testCase, options?)`: Execute a single test case
- `executeTestSuite(testCases, options?)`: Execute multiple test cases
- `generateReport(format, filePath?)`: Generate test reports in various formats
- `getSummary()`: Get test execution summary
- `getFailureAnalysis()`: Get detailed failure analysis
- `cleanup()`: Clean up all resources

### PlaywrightExecutor

Core test execution engine using Playwright.

#### Browser Configuration

```typescript
interface BrowserConfig {
  browser?: 'chromium' | 'firefox' | 'webkit';
  headless?: boolean;
  viewport?: { width: number; height: number };
  timeout?: number;
  recordVideo?: { dir: string };
  args?: string[];
  ignoreHTTPSErrors?: boolean;
  contextOptions?: BrowserContextOptions;
}
```

#### Supported Test Actions

- `navigate`: Navigate to a URL
- `click`: Click an element
- `fill`: Fill an input field
- `type`: Type text into an element
- `select`: Select dropdown option
- `hover`: Hover over an element
- `scroll`: Scroll to element or page
- `wait`: Wait for specified time
- `waitForElement`: Wait for element to appear
- `waitForNavigation`: Wait for page navigation
- `assert`: Perform assertions
- `keyPress`: Press keyboard keys

### BrowserUtils

Advanced browser interaction utilities with retry logic.

#### Key Methods

- `smartClick(page, selector, options?)`: Intelligent clicking with fallbacks
- `smartFill(page, selector, text, options?)`: Robust text input
- `waitForElement(page, selector, options?)`: Wait for elements with retry
- `dragAndDrop(page, source, target, options?)`: Drag and drop operations
- `takeScreenshot(page, selector?, filename?)`: Capture screenshots
- `getPerformanceMetrics(page)`: Collect performance data
- `uploadFile(page, selector, filePaths, options?)`: File uploads

### TestResultHandler

Comprehensive test result processing and reporting.

#### Report Formats

- **HTML**: Rich interactive reports with charts and graphs
- **JSON**: Machine-readable test data
- **JUnit**: XML format for CI/CD integration

#### Analysis Features

- Failure pattern analysis
- Performance metrics tracking
- Step-level result breakdown
- Artifact management (screenshots, videos, traces)

## Configuration Options

### Browser Configuration

```typescript
const browserConfig: BrowserConfig = {
  browser: 'chromium',              // Browser type
  headless: true,                   // Headless mode
  viewport: { width: 1280, height: 720 }, // Window size
  timeout: 30000,                   // Default timeout
  recordVideo: { dir: './videos' }, // Video recording
  ignoreHTTPSErrors: true,          // Ignore SSL errors
  args: ['--no-sandbox']            // Browser arguments
};
```

### Execution Options

```typescript
const executionOptions: ExecutionOptions = {
  captureOnSuccess: false,          // Screenshot on success
  stopOnFailure: false,             // Stop suite on first failure
  delayBetweenTests: 1000,          // Delay between tests (ms)
  maxRetries: 2,                    // Retry failed tests
  parallel: {                       // Parallel execution
    enabled: true,
    workers: 4
  }
};
```

### Utilities Configuration

```typescript
const utilsConfig: UtilsConfig = {
  defaultWaitTimeout: 30000,        // Default wait timeout
  retryConfig: {                    // Retry configuration
    maxRetries: 3,
    delay: 1000,
    backoff: 'exponential'
  },
  screenshots: {                    // Screenshot settings
    onFailure: true,
    onSuccess: false,
    fullPage: true
  }
};
```

## Event Handling

```typescript
const events: TestExecutionEvents = {
  onTestStart: (testId) => {
    console.log(`Starting test: ${testId}`);
  },
  onTestComplete: (testId, result) => {
    console.log(`Completed test: ${testId} - ${result.status}`);
  },
  onTestFailure: (testId, error) => {
    console.error(`Test failed: ${testId} - ${error}`);
  },
  onSuiteStart: (suiteId) => {
    console.log(`Starting test suite: ${suiteId}`);
  },
  onSuiteComplete: (suiteId, summary) => {
    console.log(`Suite completed: ${suiteId}`, summary);
  }
};
```

## Performance Monitoring

The automation package automatically collects performance metrics:

```typescript
const metrics = await utils.getPerformanceMetrics(page);

// Available metrics:
// - Navigation timing
// - Resource loading times
// - Core Web Vitals (LCP, FID, CLS)
// - Custom performance marks
```

## Error Handling and Debugging

### Built-in Retry Logic

All browser interactions include automatic retry with exponential backoff:

```typescript
// Automatic retries for failed operations
await utils.smartClick(page, '#unstable-button');
```

### Comprehensive Error Information

Test failures include detailed context:

```typescript
{
  testCaseId: 'login-test',
  status: 'FAILED',
  error: 'Element not found: #submit-button',
  stepResults: [
    {
      step: 1,
      status: 'PASSED',
      duration: 1250
    },
    {
      step: 2,
      status: 'FAILED',
      duration: 30000,
      error: 'Timeout waiting for element'
    }
  ],
  artifacts: {
    screenshot: './screenshots/login-test-failure.png',
    video: './videos/login-test.mp4'
  }
}
```

## Best Practices

### 1. Use Smart Utilities

Prefer `smart*` methods for better reliability:

```typescript
// Instead of direct Playwright calls
await page.click('#button');

// Use smart utilities
await utils.smartClick(page, '#button');
```

### 2. Configure Appropriate Timeouts

Set timeouts based on your application's characteristics:

```typescript
const config: BrowserConfig = {
  timeout: 60000,  // For slow applications
  // or
  timeout: 5000    // For fast applications
};
```

### 3. Handle Dynamic Content

Use explicit waits for dynamic content:

```typescript
await utils.waitForElement(page, '#dynamic-content', {
  waitForVisible: true,
  timeout: 30000
});
```

### 4. Organize Test Data

Structure test data for reusability:

```typescript
const testData = {
  users: {
    validUser: { username: 'user@test.com', password: 'valid123' },
    invalidUser: { username: 'bad@test.com', password: 'wrong' }
  },
  urls: {
    login: 'https://app.example.com/login',
    dashboard: 'https://app.example.com/dashboard'
  }
};
```

## Troubleshooting

### Common Issues

1. **Element Not Found**: Use more specific selectors or add waits
2. **Timeout Errors**: Increase timeout values or optimize selectors
3. **Flaky Tests**: Implement proper waits and use smart utilities
4. **Memory Issues**: Ensure proper cleanup with `engine.cleanup()`

### Debug Mode

Enable debug logging:

```typescript
const engine = createAutomationEngine({
  browser: 'chromium',
  headless: false  // Show browser for debugging
});
```

## Integration Examples

### CI/CD Integration

```typescript
// In your CI pipeline
const results = await engine.executeTestSuite(testCases);
await engine.generateReport('junit', './reports/results.xml');

// Exit with appropriate code
process.exit(results.some(r => r.status === 'FAILED') ? 1 : 0);
```

### Custom Reporting

```typescript
// Generate multiple report formats
await Promise.all([
  engine.generateReport('html', './reports/detailed.html'),
  engine.generateReport('json', './reports/data.json'),
  engine.generateReport('junit', './reports/junit.xml')
]);
```

## TypeScript Support

The package is fully typed with comprehensive TypeScript definitions:

```typescript
import type {
  BrowserConfig,
  ExecutionOptions,
  TestResult,
  PerformanceMetrics
} from '@ai-testing-agent/automation';
```

## Contributing

When extending the automation package:

1. Add comprehensive error handling
2. Include retry logic for network operations
3. Support multiple browsers consistently
4. Add appropriate TypeScript types
5. Include performance considerations

---

For more examples and advanced usage, see the `/src/example.ts` file in this package.


