import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Global teardown for Playwright tests
 * This runs once after all tests complete
 */
async function globalTeardown() {
  console.log('🧹 Starting global teardown...');

  try {
    // Generate final test summary
    await generateFinalSummary();

    // Cleanup temporary files
    await cleanupTemporaryFiles();

    // Archive test results if needed
    await archiveTestResults();

    // Send notifications if configured
    await sendNotifications();

    console.log('✅ Global teardown completed successfully');
  } catch (error) {
    console.error('❌ Global teardown failed:', error);
    // Don't throw error to avoid masking test failures
  }
}

/**
 * Generate final test execution summary
 */
async function generateFinalSummary(): Promise<void> {
  console.log('📊 Generating final test summary...');

  try {
    const resultsDir = './test-results';
    const summaryFile = path.join(resultsDir, 'final-summary.json');

    // Collect all test result files
    const resultFiles = await findTestResultFiles(resultsDir);
    
    const summary = {
      executionCompleted: new Date().toISOString(),
      totalFiles: resultFiles.length,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        ci: !!process.env.CI,
        baseUrl: process.env.BASE_URL,
        headless: process.env.HEADLESS !== 'false'
      },
      files: resultFiles.map(file => ({
        name: path.basename(file),
        path: file,
        size: 0 // Will be filled below
      }))
    };

    // Get file sizes
    for (const fileInfo of summary.files) {
      try {
        const stats = await fs.stat(fileInfo.path);
        fileInfo.size = stats.size;
      } catch {
        fileInfo.size = 0;
      }
    }

    await fs.writeFile(summaryFile, JSON.stringify(summary, null, 2));
    console.log('✅ Final summary generated');

  } catch (error) {
    console.warn('⚠️  Failed to generate final summary:', error);
  }
}

/**
 * Find all test result files
 */
async function findTestResultFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        const subFiles = await findTestResultFiles(fullPath);
        files.push(...subFiles);
      } else if (entry.isFile()) {
        // Include common test result file types
        const extensions = ['.json', '.xml', '.html', '.png', '.mp4', '.webm', '.zip'];
        if (extensions.some(ext => entry.name.endsWith(ext))) {
          files.push(fullPath);
        }
      }
    }
  } catch (error) {
    console.warn(`Failed to read directory ${dir}:`, error);
  }
  
  return files;
}

/**
 * Cleanup temporary files and optimize storage
 */
async function cleanupTemporaryFiles(): Promise<void> {
  console.log('🗑️  Cleaning up temporary files...');

  try {
    const cleanupTasks = [
      cleanupOldScreenshots(),
      cleanupOldVideos(),
      cleanupOldTraces(),
      removeEmptyDirectories()
    ];

    await Promise.all(cleanupTasks);
    console.log('✅ Temporary files cleaned up');

  } catch (error) {
    console.warn('⚠️  Failed to cleanup temporary files:', error);
  }
}

/**
 * Remove old screenshots (keep only recent ones)
 */
async function cleanupOldScreenshots(): Promise<void> {
  const screenshotsDir = './test-results/screenshots';
  await cleanupOldFiles(screenshotsDir, 7 * 24 * 60 * 60 * 1000); // 7 days
}

/**
 * Remove old videos (keep only recent ones)
 */
async function cleanupOldVideos(): Promise<void> {
  const videosDir = './test-results/videos';
  await cleanupOldFiles(videosDir, 3 * 24 * 60 * 60 * 1000); // 3 days
}

/**
 * Remove old traces (keep only recent ones)
 */
async function cleanupOldTraces(): Promise<void> {
  const tracesDir = './test-results/traces';
  await cleanupOldFiles(tracesDir, 2 * 24 * 60 * 60 * 1000); // 2 days
}

/**
 * Clean up files older than specified age
 */
async function cleanupOldFiles(dir: string, maxAge: number): Promise<void> {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const now = Date.now();

    for (const entry of entries) {
      if (entry.isFile()) {
        const filePath = path.join(dir, entry.name);
        const stats = await fs.stat(filePath);
        const age = now - stats.mtime.getTime();

        if (age > maxAge) {
          await fs.unlink(filePath);
          console.log(`🗑️  Removed old file: ${entry.name}`);
        }
      }
    }
  } catch (error) {
    console.warn(`Failed to cleanup directory ${dir}:`, error);
  }
}

/**
 * Remove empty directories
 */
async function removeEmptyDirectories(): Promise<void> {
  const resultsDir = './test-results';
  await removeEmptyDirsRecursive(resultsDir);
}

/**
 * Recursively remove empty directories
 */
async function removeEmptyDirsRecursive(dir: string): Promise<void> {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    // First, recursively process subdirectories
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const subDir = path.join(dir, entry.name);
        await removeEmptyDirsRecursive(subDir);
      }
    }

    // Then check if current directory is now empty (except for certain protected dirs)
    const protectedDirs = ['test-results', 'screenshots', 'videos', 'traces', 'reports'];
    const dirName = path.basename(dir);
    
    if (!protectedDirs.includes(dirName)) {
      const currentEntries = await fs.readdir(dir);
      if (currentEntries.length === 0) {
        await fs.rmdir(dir);
        console.log(`🗑️  Removed empty directory: ${dirName}`);
      }
    }
  } catch (error) {
    // Ignore errors for directory removal
  }
}

/**
 * Archive test results for long-term storage
 */
async function archiveTestResults(): Promise<void> {
  const shouldArchive = process.env.ARCHIVE_RESULTS === 'true';
  
  if (!shouldArchive) {
    return;
  }

  console.log('📦 Archiving test results...');

  try {
    // This would typically compress and move files to long-term storage
    // For now, just log the intention
    console.log('✅ Test results archived (placeholder)');
  } catch (error) {
    console.warn('⚠️  Failed to archive test results:', error);
  }
}

/**
 * Send notifications about test completion
 */
async function sendNotifications(): Promise<void> {
  const notificationUrl = process.env.NOTIFICATION_WEBHOOK_URL;
  const slackChannel = process.env.SLACK_CHANNEL;
  
  if (!notificationUrl && !slackChannel) {
    return;
  }

  console.log('📬 Sending notifications...');

  try {
    // Read final summary
    const summaryFile = './test-results/final-summary.json';
    let summary;
    
    try {
      const summaryContent = await fs.readFile(summaryFile, 'utf-8');
      summary = JSON.parse(summaryContent);
    } catch {
      summary = { message: 'Test execution completed' };
    }

    // Send webhook notification
    if (notificationUrl) {
      await sendWebhookNotification(notificationUrl, summary);
    }

    // Send Slack notification
    if (slackChannel) {
      await sendSlackNotification(slackChannel, summary);
    }

    console.log('✅ Notifications sent');

  } catch (error) {
    console.warn('⚠️  Failed to send notifications:', error);
  }
}

/**
 * Send webhook notification
 */
async function sendWebhookNotification(url: string, summary: any): Promise<void> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Test execution completed',
        summary,
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.status}`);
    }
  } catch (error) {
    console.warn('Failed to send webhook notification:', error);
  }
}

/**
 * Send Slack notification
 */
async function sendSlackNotification(channel: string, _summary: any): Promise<void> {
  // This would typically use Slack API to send notifications
  // For now, just log the intention
  console.log(`📱 Would send Slack notification to ${channel}`);
}

export default globalTeardown;
