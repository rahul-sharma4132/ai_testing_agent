export const DEFAULT_CONFIG = {
    discovery: {
      maxDepth: 3,
      timeout: 30000,
      excludePatterns: ['/admin', '/debug', '*.pdf', '*.zip'],
      includeAPIs: true
    },
    testing: {
      retryAttempts: 3,
      screenshotOnFailure: true,
      videoRecording: false,
      parallelExecutions: 1
    },
    database: {
      connectionTimeout: 10000,
      queryTimeout: 30000
    }
  };
  
  export const SUPPORTED_BROWSERS = ['chromium', 'firefox', 'webkit'] as const;
  export type BrowserType = typeof SUPPORTED_BROWSERS[number];