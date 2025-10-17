/**
 * Sample Test: Google Search Automation
 * 
 * This demonstrates the automation engine with a real-world test case
 * Testing Google search functionality
 */

import { createAutomationEngine } from './dist/index.js';

// Create a test case for Google search
const googleSearchTest = {
  id: 'google-search-001',
  moduleId: 'search-module',
  title: 'Google Search - Node.js Query',
  description: 'Test Google search functionality by searching for Node.js',
  type: 'UI_WORKFLOW',
  priority: 'HIGH',
  steps: [
    {
      step: 1,
      action: 'navigate',
      expected: 'https://www.google.com',
      element: '',
      data: {},
      description: 'Navigate to Google homepage'
    },
    {
      step: 2,
      action: 'wait',
      expected: '2000',
      element: '',
      data: {},
      description: 'Wait for page to load'
    },
    {
      step: 3,
      action: 'fill',
      expected: '{{searchQuery}}',
      element: 'textarea[name="q"]',
      data: {},
      description: 'Enter search query in search box'
    },
    {
      step: 4,
      action: 'wait',
      expected: '1000',
      element: '',
      data: {},
      description: 'Wait before submission'
    },
    {
      step: 5,
      action: 'keyPress',
      expected: 'Enter',
      element: '',
      data: {},
      description: 'Press Enter to submit search'
    },
    {
      step: 6,
      action: 'wait',
      expected: '3000',
      element: '',
      data: {},
      description: 'Wait for search results to load'
    },
    {
      step: 7,
      action: 'assert',
      expected: 'title_contains:Node.js',
      element: '',
      data: {},
      description: 'Verify search results page title contains Node.js'
    }
  ],
  testData: {
    searchQuery: 'Node.js tutorial for beginners'
  },
  expectedResults: [
    'Search query should be entered successfully',
    'Search results should be displayed',
    'Page title should contain the search term'
  ],
  dependencies: [],
  status: 'ACTIVE',
  createdAt: new Date(),
  updatedAt: new Date()
};

// Configure the automation engine
const browserConfig = {
  browser: 'chromium',
  headless: false,  // Set to true for headless mode
  viewport: { width: 1280, height: 720 },
  timeout: 30000,
  ignoreHTTPSErrors: true
};

const utilsConfig = {
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

// Event handlers
const events = {
  onTestStart: (testId) => {
    console.log(`\n🚀 Starting test: ${testId}`);
    console.log('━'.repeat(60));
  },
  onTestComplete: (testId, result) => {
    console.log('━'.repeat(60));
    console.log(`\n✅ Test completed: ${testId}`);
    console.log(`   Status: ${result.status}`);
    console.log(`   Duration: ${result.duration}ms`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  },
  onTestFailure: (testId, error) => {
    console.error(`\n❌ Test failed: ${testId}`);
    console.error(`   Error: ${error}`);
  },
  onStepComplete: (testId, stepNumber, stepResult) => {
    const icon = stepResult.status === 'PASSED' ? '✓' : '✗';
    console.log(`   ${icon} Step ${stepNumber}: ${stepResult.status} (${stepResult.duration}ms)`);
  }
};

// Main test execution
async function runGoogleSearchTest() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║     AI Testing Agent - Google Search Automation Test      ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  console.log('📋 Test Case Details:');
  console.log(`   ID: ${googleSearchTest.id}`);
  console.log(`   Title: ${googleSearchTest.title}`);
  console.log(`   Type: ${googleSearchTest.type}`);
  console.log(`   Priority: ${googleSearchTest.priority}`);
  console.log(`   Steps: ${googleSearchTest.steps.length}`);
  console.log(`   Search Query: "${googleSearchTest.testData.searchQuery}"\n`);

  // Create automation engine
  const engine = createAutomationEngine(browserConfig, utilsConfig, events);

  try {
    // Initialize the engine
    console.log('🔧 Initializing automation engine...');
    await engine.initialize();
    console.log('✓ Engine initialized successfully\n');

    // Execute the test
    const result = await engine.executeTest(googleSearchTest, {
      captureOnSuccess: false,
      stopOnFailure: true
    });

    // Display results
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                      Test Results                          ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    
    console.log('📊 Summary:');
    console.log(`   Test ID: ${result.testCaseId}`);
    console.log(`   Status: ${result.status}`);
    console.log(`   Duration: ${result.duration}ms (${(result.duration / 1000).toFixed(2)}s)`);
    console.log(`   Start Time: ${result.startTime?.toLocaleString()}`);
    console.log(`   End Time: ${result.endTime?.toLocaleString()}`);
    
    if (result.stepResults && result.stepResults.length > 0) {
      console.log('\n📝 Step Details:');
      result.stepResults.forEach((step) => {
        const statusIcon = step.status === 'PASSED' ? '✅' : '❌';
        console.log(`   ${statusIcon} Step ${step.step}: ${step.status} - ${step.duration}ms`);
        if (step.error) {
          console.log(`      Error: ${step.error}`);
        }
      });
    }

    if (result.error) {
      console.log(`\n❌ Error: ${result.error}`);
    }

    if (result.artifacts) {
      console.log('\n📎 Artifacts:');
      if (result.artifacts.screenshot) {
        console.log(`   Screenshot: ${result.artifacts.screenshot}`);
      }
      if (result.artifacts.video) {
        console.log(`   Video: ${result.artifacts.video}`);
      }
      if (result.artifacts.logs && result.artifacts.logs.length > 0) {
        console.log(`   Logs: ${result.artifacts.logs.length} entries`);
      }
    }

    // Get overall summary
    const summary = engine.getSummary();
    console.log('\n📈 Execution Summary:');
    console.log(`   Total Tests: ${summary.totalTests || 1}`);
    console.log(`   Passed: ${summary.passed || 0}`);
    console.log(`   Failed: ${summary.failed || 0}`);
    console.log(`   Skipped: ${summary.skipped || 0}`);
    console.log(`   Success Rate: ${(summary.successRate || 100).toFixed(2)}%`);

    // Generate report
    console.log('\n📄 Generating test report...');
    const reportPath = await engine.generateReport('json', './test-report.json');
    console.log(`✓ Report saved to: ${reportPath}`);

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║              Test Execution Completed Successfully!        ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

  } catch (error) {
    console.error('\n❌ Test execution failed with error:');
    console.error(error);
    process.exit(1);
  } finally {
    // Cleanup
    console.log('🧹 Cleaning up resources...');
    await engine.cleanup();
    console.log('✓ Cleanup complete\n');
  }
}

// Run the test
runGoogleSearchTest().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

