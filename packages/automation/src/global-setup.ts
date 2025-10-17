import * as fs from 'fs/promises';
import { chromium } from 'playwright';

/**
 * Global setup for Playwright tests
 * This runs once before all tests
 */
async function globalSetup() {
  console.log('🚀 Starting global setup...');

  try {
    // Ensure test results directories exist
    await ensureDirectoriesExist();

    // Setup authentication if needed
    await setupAuthentication();

    // Initialize test data
    await initializeTestData();

    // Warm up the browser
    await warmupBrowser();

    console.log('✅ Global setup completed successfully');
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  }
}

/**
 * Ensure all necessary directories exist
 */
async function ensureDirectoriesExist(): Promise<void> {
  const directories = [
    './test-results',
    './test-results/screenshots',
    './test-results/videos',
    './test-results/traces',
    './test-results/artifacts',
    './test-results/reports'
  ];

  for (const dir of directories) {
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
      console.log(`📁 Created directory: ${dir}`);
    }
  }
}

/**
 * Setup authentication state for tests
 */
async function setupAuthentication(): Promise<void> {
  const authFile = './test-results/auth-state.json';
  
  // Skip if auth file already exists and is recent
  try {
    const stats = await fs.stat(authFile);
    const age = Date.now() - stats.mtime.getTime();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    if (age < maxAge) {
      console.log('🔐 Using existing authentication state');
      return;
    }
  } catch {
    // File doesn't exist, proceed with setup
  }

  // Only setup auth if credentials are provided
  const username = process.env.TEST_USERNAME;
  const password = process.env.TEST_PASSWORD;
  const loginUrl = process.env.LOGIN_URL;

  if (!username || !password || !loginUrl) {
    console.log('⚠️  No authentication credentials provided, skipping auth setup');
    return;
  }

  console.log('🔐 Setting up authentication state...');

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to login page
    await page.goto(loginUrl);

    // Perform login
    await page.fill('#username', username);
    await page.fill('#password', password);
    await page.click('#login-button');

    // Wait for successful login
    await page.waitForURL('**/dashboard*', { timeout: 30000 });

    // Save authentication state
    await context.storageState({ path: authFile });
    console.log('✅ Authentication state saved');

  } catch (error) {
    console.warn('⚠️  Authentication setup failed:', error);
  } finally {
    await browser.close();
  }
}

/**
 * Initialize test data
 */
async function initializeTestData(): Promise<void> {
  console.log('📊 Initializing test data...');

  const testDataFile = './test-results/test-data.json';
  
  const defaultTestData = {
    users: {
      testUser: {
        username: process.env.TEST_USERNAME || 'test@example.com',
        password: process.env.TEST_PASSWORD || 'testpass123',
        role: 'user'
      },
      adminUser: {
        username: process.env.ADMIN_USERNAME || 'admin@example.com',
        password: process.env.ADMIN_PASSWORD || 'adminpass123',
        role: 'admin'
      }
    },
    urls: {
      baseUrl: process.env.BASE_URL || 'http://localhost:3000',
      loginUrl: process.env.LOGIN_URL || 'http://localhost:3000/login',
      dashboardUrl: process.env.DASHBOARD_URL || 'http://localhost:3000/dashboard'
    },
    timeouts: {
      short: 5000,
      medium: 15000,
      long: 30000
    }
  };

  await fs.writeFile(testDataFile, JSON.stringify(defaultTestData, null, 2));
  console.log('✅ Test data initialized');
}

/**
 * Warm up browser to ensure faster test execution
 */
async function warmupBrowser(): Promise<void> {
  console.log('🔥 Warming up browser...');

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to a simple page to warm up
    await page.goto('about:blank');
    await page.content();
  } catch (error) {
    console.warn('⚠️  Browser warmup failed:', error);
  } finally {
    await browser.close();
  }

  console.log('✅ Browser warmed up');
}

export default globalSetup;
