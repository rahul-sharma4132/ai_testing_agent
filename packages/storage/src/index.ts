// Main exports
export { Database, type DatabaseConfig } from './database.js';
export { StorageService } from './storage-service.js';
export type { StorageServiceConfig } from './storage-service.js';

// Simple Repository exports (working versions)
export {
    SimpleApplicationRepository,
    SimpleTestCaseRepository,
    SimpleTestExecutionRepository
} from './simple-repositories.js';

// Schema exports
export * from './schema.js';

// Configuration helper
export function createStorageConfig(
  options: {
    host?: string;
    port?: number;
    database?: string;
    username?: string;
    password?: string;
    ssl?: boolean;
    autoMigrate?: boolean;
  } = {}
) {
  return {
    database: {
      host: options.host ?? process.env.DB_HOST ?? 'localhost',
      port: options.port ?? Number(process.env.DB_PORT) ?? 5432,
      database: options.database ?? process.env.DB_NAME ?? 'ai_testing_agent',
      username: options.username ?? process.env.DB_USERNAME ?? 'postgres',
      password: options.password ?? process.env.DB_PASSWORD ?? 'password',
      ssl: options.ssl ?? process.env.DB_SSL === 'true',
      maxConnections: 20,
      connectionTimeout: 10000,
    },
    autoMigrate: options.autoMigrate ?? process.env.AUTO_MIGRATE === 'true',
  };
}

// Factory function for quick setup
export async function createStorageService(config: any = {}) {
  const storageConfig = {
    ...createStorageConfig({}),
    ...config,
  };

  const { StorageService } = await import('./storage-service.js');
  const service = new StorageService(storageConfig);
  await service.initialize();

  return service;
}
