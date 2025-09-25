import { 
  pgTable, 
  text, 
  timestamp, 
  integer, 
  jsonb, 
  varchar,
  uuid,
  index,
  unique
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Applications table
export const applications = pgTable('applications', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 256 }).notNull(),
  url: varchar('url', { length: 512 }).notNull(),
  description: text('description'),
  config: jsonb('config').notNull(),
  status: varchar('status', { length: 50 }).notNull().default('active'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  nameIdx: index('applications_name_idx').on(table.name),
  urlIdx: index('applications_url_idx').on(table.url),
  statusIdx: index('applications_status_idx').on(table.status),
  uniqueUrl: unique('applications_url_unique').on(table.url),
}));

export const applicationsRelations = relations(applications, ({ many }) => ({
  modules: many(modules),
  crawlResults: many(crawlResults),
  testCases: many(testCases),
  testSuites: many(testSuites),
}));

// Modules table
export const modules = pgTable('modules', {
  id: uuid('id').primaryKey().defaultRandom(),
  applicationId: uuid('application_id').references(() => applications.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 256 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  endpoints: jsonb('endpoints'),
  components: jsonb('components'),
  dependencies: jsonb('dependencies'),
  discoveredAt: timestamp('discovered_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  applicationIdx: index('modules_application_idx').on(table.applicationId),
  typeIdx: index('modules_type_idx').on(table.type),
}));

export const modulesRelations = relations(modules, ({ one, many }) => ({
  application: one(applications, {
    fields: [modules.applicationId],
    references: [applications.id],
  }),
  testCases: many(testCases),
}));

// Crawl Results table
export const crawlResults = pgTable('crawl_results', {
  id: uuid('id').primaryKey().defaultRandom(),
  applicationId: uuid('application_id').references(() => applications.id, { onDelete: 'cascade' }).notNull(),
  analysisId: varchar('analysis_id', { length: 256 }).notNull(),
  pages: jsonb('pages'),
  apiEndpoints: jsonb('api_endpoints'),
  totalPagesFound: integer('total_pages_found').notNull(),
  analysisMetadata: jsonb('analysis_metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  applicationIdx: index('crawl_results_application_idx').on(table.applicationId),
  analysisIdx: index('crawl_results_analysis_idx').on(table.analysisId),
}));

export const crawlResultsRelations = relations(crawlResults, ({ one }) => ({
  application: one(applications, {
    fields: [crawlResults.applicationId],
    references: [applications.id],
  }),
}));

// Test Cases table
export const testCases = pgTable('test_cases', {
  id: uuid('id').primaryKey().defaultRandom(),
  applicationId: uuid('application_id').references(() => applications.id, { onDelete: 'cascade' }).notNull(),
  moduleId: uuid('module_id').references(() => modules.id, { onDelete: 'set null' }),
  title: varchar('title', { length: 512 }).notNull(),
  description: text('description'),
  type: varchar('type', { length: 50 }).notNull(),
  priority: varchar('priority', { length: 50 }).notNull(),
  steps: jsonb('steps'),
  testData: jsonb('test_data'),
  expectedResults: jsonb('expected_results'),
  dependencies: jsonb('dependencies'),
  tags: jsonb('tags'),
  status: varchar('status', { length: 50 }).notNull().default('ACTIVE'),
  estimatedDuration: integer('estimated_duration'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  applicationIdx: index('test_cases_application_idx').on(table.applicationId),
  moduleIdx: index('test_cases_module_idx').on(table.moduleId),
  typeIdx: index('test_cases_type_idx').on(table.type),
  priorityIdx: index('test_cases_priority_idx').on(table.priority),
  statusIdx: index('test_cases_status_idx').on(table.status),
}));

export const testCasesRelations = relations(testCases, ({ one, many }) => ({
  application: one(applications, {
    fields: [testCases.applicationId],
    references: [applications.id],
  }),
  module: one(modules, {
    fields: [testCases.moduleId],
    references: [modules.id],
  }),
  testExecutions: many(testExecutions),
  testSuiteCases: many(testSuiteCases),
}));

// Test Executions table
export const testExecutions = pgTable('test_executions', {
  id: uuid('id').primaryKey().defaultRandom(),
  testCaseId: uuid('test_case_id').references(() => testCases.id, { onDelete: 'cascade' }).notNull(),
  executionId: varchar('execution_id', { length: 256 }).notNull(),
  status: varchar('status', { length: 50 }).notNull(),
  duration: integer('duration').notNull(),
  error: text('error'),
  stepResults: jsonb('step_results'),
  artifacts: jsonb('artifacts'),
  environment: jsonb('environment'),
  retryCount: integer('retry_count').default(0).notNull(),
  executedAt: timestamp('executed_at').defaultNow().notNull(),
}, (table) => ({
  testCaseIdx: index('test_executions_test_case_idx').on(table.testCaseId),
  executionIdx: index('test_executions_execution_idx').on(table.executionId),
  statusIdx: index('test_executions_status_idx').on(table.status),
  executedAtIdx: index('test_executions_executed_at_idx').on(table.executedAt),
}));

export const testExecutionsRelations = relations(testExecutions, ({ one }) => ({
  testCase: one(testCases, {
    fields: [testExecutions.testCaseId],
    references: [testCases.id],
  }),
}));

// Test Suites table
export const testSuites = pgTable('test_suites', {
  id: uuid('id').primaryKey().defaultRandom(),
  applicationId: uuid('application_id').references(() => applications.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 256 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  applicationIdx: index('test_suites_application_idx').on(table.applicationId),
}));

export const testSuitesRelations = relations(testSuites, ({ one, many }) => ({
  application: one(applications, {
    fields: [testSuites.applicationId],
    references: [applications.id],
  }),
  testSuiteCases: many(testSuiteCases),
}));

// Junction table for Test Cases and Test Suites
export const testSuiteCases = pgTable('test_suite_cases', {
  testSuiteId: uuid('test_suite_id').references(() => testSuites.id, { onDelete: 'cascade' }).notNull(),
  testCaseId: uuid('test_case_id').references(() => testCases.id, { onDelete: 'cascade' }).notNull(),
  assignedAt: timestamp('assigned_at').defaultNow().notNull(),
}, (table) => ({
  suiteIdx: index('test_suite_cases_suite_idx').on(table.testSuiteId),
  caseIdx: index('test_suite_cases_case_idx').on(table.testCaseId),
}));

export const testSuiteCasesRelations = relations(testSuiteCases, ({ one }) => ({
  testSuite: one(testSuites, {
    fields: [testSuiteCases.testSuiteId],
    references: [testSuites.id],
  }),
  testCase: one(testCases, {
    fields: [testSuiteCases.testCaseId],
    references: [testCases.id],
  }),
}));

// Performance Metrics table
export const performanceMetrics = pgTable('performance_metrics', {
  id: uuid('id').primaryKey().defaultRandom(),
  testExecutionId: uuid('test_execution_id').references(() => testExecutions.id, { onDelete: 'cascade' }),
  metricName: varchar('metric_name', { length: 256 }).notNull(),
  value: integer('value').notNull(),
  unit: varchar('unit', { length: 50 }).notNull(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  metadata: jsonb('metadata'),
}, (table) => ({
  executionIdx: index('performance_metrics_execution_idx').on(table.testExecutionId),
  metricIdx: index('performance_metrics_metric_idx').on(table.metricName),
  timestampIdx: index('performance_metrics_timestamp_idx').on(table.timestamp),
}));

export const performanceMetricsRelations = relations(performanceMetrics, ({ one }) => ({
  testExecution: one(testExecutions, {
    fields: [performanceMetrics.testExecutionId],
    references: [testExecutions.id],
  }),
}));
