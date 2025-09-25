import { Database, type DatabaseConfig, type DrizzleDatabase } from './database.js';
import { SimpleApplicationRepository, SimpleTestCaseRepository, SimpleTestExecutionRepository } from './simple-repositories.js';
import { Logger } from '@ai-testing-agent/core';

export interface StorageServiceConfig {
  database: DatabaseConfig;
  autoMigrate?: boolean;
}

export class StorageService {
  private database: Database;
  private logger = new Logger('StorageService');

  // Repository instances
  public readonly applications: SimpleApplicationRepository;
  public readonly testCases: SimpleTestCaseRepository;
  public readonly testExecutions: SimpleTestExecutionRepository;

  constructor(config: StorageServiceConfig) {
    this.database = new Database(config.database);
    
    // Initialize repositories
    this.applications = new SimpleApplicationRepository(this.database.client);
    this.testCases = new SimpleTestCaseRepository(this.database.client);
    this.testExecutions = new SimpleTestExecutionRepository(this.database.client);

    this.logger.info('StorageService initialized');
  }

  async initialize(): Promise<void> {
    this.logger.info('Initializing Storage Service...');
    
    try {
      // Connect to database
      await this.database.connect();
      
      // Run migrations if auto-migrate is enabled
      // if (this.config?.autoMigrate) {
      //   await this.database.migrate();
      // }
      
      this.logger.info('Storage service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize storage service', error);
      throw error;
    }
  }

  async shutdown(): Promise<void> {
    this.logger.info('Shutting down Storage Service...');
    try {
      await this.database.disconnect();
      this.logger.info('Storage service shut down successfully');
    } catch (error) {
      this.logger.error('Error during storage service shutdown', error);
      throw error;
    }
  }

  async healthCheck(): Promise<{ status: string; database: string }> {
    try {
      return await this.database.healthCheck();
    } catch (error) {
      this.logger.error('Storage service health check failed', error);
      return { status: 'error', database: 'disconnected' };
    }
  }

  // Transaction support
  async transaction<T>(callback: (tx: DrizzleDatabase) => Promise<T>): Promise<T> {
    this.logger.debug('Starting transaction');
    
    try {
      // For now, just use the regular database connection
      // In a full implementation, this would use actual transactions
      const result = await callback(this.database.client);
      this.logger.debug('Transaction completed successfully');
      return result;
    } catch (error) {
      this.logger.error('Transaction failed', error);
      throw error;
    }
  }

  // Bulk operations
  async bulkInsertTestCases(testCases: any[]) {
    this.logger.info(`Bulk inserting ${testCases.length} test cases`);
    
    const results = await Promise.allSettled(
      testCases.map(testCase => this.testCases.create(testCase))
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    this.logger.info(`Bulk insert completed: ${successful} successful, ${failed} failed`);
    
    return {
      successful,
      failed,
      results: results.map((result, index) => ({
        index,
        status: result.status,
        data: result.status === 'fulfilled' ? result.value : null,
        error: result.status === 'rejected' ? result.reason : null,
      })),
    };
  }

  async bulkInsertTestExecutions(executions: any[]) {
    this.logger.info(`Bulk inserting ${executions.length} test executions`);
    
    const results = await Promise.allSettled(
      executions.map(execution => this.testExecutions.create(execution))
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    this.logger.info(`Bulk insert completed: ${successful} successful, ${failed} failed`);
    
    return {
      successful,
      failed,
      results: results.map((result, index) => ({
        index,
        status: result.status,
        data: result.status === 'fulfilled' ? result.value : null,
        error: result.status === 'rejected' ? result.reason : null,
      })),
    };
  }

  // Analytics and reporting
  async getDashboardStats(applicationId?: string) {
    this.logger.debug('Getting dashboard statistics');
    
    const [applicationStats, testCaseStats, executionStats, recentExecutions] = await Promise.all([
      this.getApplicationStats(applicationId),
      this.getTestCaseStats(applicationId),
      this.getExecutionStats(applicationId),
      this.getRecentExecutions(applicationId),
    ]);

    return {
      applications: applicationStats,
      testCases: testCaseStats,
      executions: executionStats,
      recentExecutions,
      timestamp: new Date(),
    };
  }

  private async getApplicationStats(_applicationId?: string) {
    const allApps = await this.applications.findAll();
    return {
      total: allApps.length,
      active: allApps.length, // Simplified
    };
  }

  private async getTestCaseStats(_applicationId?: string) {
    const testCases = await this.testCases.findAll();
    
    return {
      total: testCases.length,
      active: testCases.length, // Simplified
      byType: {},
      byPriority: {},
    };
  }

  private async getExecutionStats(_applicationId?: string, _days = 30) {
    const executions = await this.testExecutions.findAll();

    return {
      total: executions.length,
      passed: 0,
      failed: 0,
      flaky: 0,
      skipped: 0,
      successRate: 0,
      avgDuration: 0,
    };
  }

  private async getRecentExecutions(_applicationId?: string, _limit = 10) {
    return await this.testExecutions.findAll();
  }

  get config() {
    return this.database;
  }
}
