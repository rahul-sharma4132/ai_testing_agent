import { TestCase } from '@ai-testing-agent/core';
import {
    BrowserConfig,
    createAutomationEngine,
    DEFAULT_BROWSER_CONFIG,
    ExecutionOptions
} from './index.js';

/**
 * Example usage of the Automation Package
 */
async function runAutomationExample() {
  // Create automation engine with custom configuration
  const browserConfig: BrowserConfig = {
    ...DEFAULT_BROWSER_CONFIG,
    headless: false, // Show browser for demo
    viewport: { width: 1920, height: 1080 }
  };

  const engine = createAutomationEngine(browserConfig, undefined, {
    onTestStart: (testId) => console.log(`Starting test: ${testId}`),
    onTestComplete: (testId, result) => console.log(`Completed test: ${testId} - ${result.status}`),
    onTestFailure: (testId, error) => console.error(`Test failed: ${testId} - ${error}`)
  });

  try {
    // Initialize the engine
    await engine.initialize();

    // Create a sample test case
    const sampleTestCase: TestCase = {
      id: 'example-login-test',
      moduleId: 'auth-module',
      title: 'User Login Test',
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
          action: 'waitForElement',
          expected: 'visible',
          element: '#username',
          data: {}
        },
        {
          step: 3,
          action: 'fill',
          expected: '{{username}}',
          element: '#username',
          data: {}
        },
        {
          step: 4,
          action: 'fill',
          expected: '{{password}}',
          element: '#password',
          data: {}
        },
        {
          step: 5,
          action: 'click',
          expected: '',
          element: '#login-button',
          data: {}
        },
        {
          step: 6,
          action: 'assert',
          expected: 'url:/dashboard',
          element: '',
          data: {}
        }
      ],
      testData: {
        username: 'test@example.com',
        password: 'testpass123'
      },
      expectedResults: ['User should be redirected to dashboard'],
      dependencies: [],
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Execution options
    const executionOptions: ExecutionOptions = {
      captureOnSuccess: true,
      stopOnFailure: false,
      delayBetweenTests: 1000,
      maxRetries: 2
    };

    // Execute the test
    console.log('Executing sample test case...');
    const result = await engine.executeTest(sampleTestCase, executionOptions);
    console.log('Test result:', result);

    // Generate reports
    const htmlReport = await engine.generateReport('html');
    const jsonReport = await engine.generateReport('json');
    const junitReport = await engine.generateReport('junit');

    console.log('Reports generated:');
    console.log('- HTML:', htmlReport);
    console.log('- JSON:', jsonReport);
    console.log('- JUnit:', junitReport);

    // Get summary and analysis
    const summary = engine.getSummary();
    const failureAnalysis = engine.getFailureAnalysis();
    const performanceSummary = engine.getPerformanceSummary();

    console.log('\nTest Summary:', summary);
    console.log('\nFailure Analysis:', failureAnalysis);
    console.log('\nPerformance Summary:', performanceSummary);

  } catch (error) {
    console.error('Automation example failed:', error);
  } finally {
    // Clean up resources
    await engine.cleanup();
  }
}

/**
 * Example of using individual components
 */
async function runComponentExample() {
    const { PlaywrightExecutor, BrowserUtils } = await import('./index.js');

  // Create individual components
  const executor = new PlaywrightExecutor({ headless: true });
  const utils = new BrowserUtils();

  try {
    // Initialize executor
    await executor.initialize();
    const page = executor.getPage();

    if (page) {
      // Use browser utilities
      await page.goto('https://example.com');
      
      // Smart click with retry
      const elementExists = await utils.elementExists(page, '#some-button');
      console.log('Element exists:', elementExists);

      // Wait for network idle
      await utils.waitForNetworkIdle(page);

      // Get performance metrics
      const metrics = await utils.getPerformanceMetrics(page);
      console.log('Performance metrics:', metrics);

      // Take screenshot
      await utils.takeScreenshot(page, undefined, './test-results/example-screenshot.png');
    }

  } catch (error) {
    console.error('Component example failed:', error);
  } finally {
    await executor.cleanup();
  }
}

// Export examples for potential execution
export { runAutomationExample, runComponentExample };
