import { Logger } from '@ai-testing-agent/core';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.js';

export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password?: string;
  database: string;
  ssl?: boolean;
  maxConnections?: number;
  connectionTimeout?: number;
}

export type DrizzleDatabase = ReturnType<typeof drizzle<typeof schema>>;

const logger = new Logger('Database');

let dbInstance: DrizzleDatabase | null = null;
let poolInstance: Pool | null = null;

export class Database {
  public client: DrizzleDatabase;
  private pool: Pool;
  // private config: DatabaseConfig;

  constructor(config: DatabaseConfig) {
    // this.config = { ...config };
    this.pool = new Pool({
      host: config.host,
      port: config.port,
      user: config.username,
      password: config.password,
      database: config.database,
      ssl: config.ssl,
      max: config.maxConnections || 20,
      connectionTimeoutMillis: config.connectionTimeout || 10000,
    });

    this.client = drizzle(this.pool, { schema, logger: new DrizzleLogger() });
    logger.info('Database instance created');
  }

  async connect(): Promise<void> {
    try {
      // Test connection
      await this.pool.connect();
      logger.info('Database connected successfully');
    } catch (error) {
      logger.error('Failed to connect to database', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      logger.info('Database disconnected');
    }
  }

  async healthCheck(): Promise<{ status: string; database: string }> {
    try {
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();
      return { status: 'ok', database: 'connected' };
    } catch (error) {
      logger.error('Database health check failed', error);
      return { status: 'error', database: 'disconnected' };
    }
  }
}

class DrizzleLogger {
  logQuery(query: string, params: unknown[]): void {
    logger.debug('Drizzle Query:', { query, params });
  }
}

export async function connectDatabase(config: DatabaseConfig): Promise<DrizzleDatabase> {
  if (dbInstance && poolInstance) {
    logger.info('Database already connected, returning existing instance.');
    return dbInstance;
  }

  const dbConfig: DatabaseConfig = {
    host: config.host,
    port: config.port,
    username: config.username,
    password: config.password || '',
    database: config.database,
    ssl: Boolean(process.env.NODE_ENV === 'production' || config.ssl)
  };

  logger.info(`Attempting to connect to database: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);

  try {
    poolInstance = new Pool(dbConfig);

    poolInstance.on('error', (err) => {
      logger.error('Unexpected error on idle client', err);
    });

    dbInstance = drizzle(poolInstance, { schema, logger: new DrizzleLogger() });
    logger.info('Database connected successfully.');
    return dbInstance;
  } catch (error) {
    logger.error('Failed to connect to database', error);
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  if (poolInstance) {
    logger.info('Disconnecting database pool.');
    await poolInstance.end();
    poolInstance = null;
    dbInstance = null;
    logger.info('Database pool disconnected.');
  }
}

export async function getDatabase(): Promise<DrizzleDatabase> {
  if (!dbInstance) {
    throw new Error('Database not connected. Call connectDatabase first.');
  }
  return dbInstance;
}
