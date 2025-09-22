// Application configuration
export interface ApplicationConfig {
    id?: string;
    name: string;
    url: string;
    credentials?: {
      username?: string;
      password?: string;
      apiKey?: string;
      database?: DatabaseConfig;
    };
    discoverySettings: {
      maxDepth: number;
      excludePatterns: string[];
      includeAPIs: boolean;
      timeout: number;
    };
  }
  
  export interface DatabaseConfig {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
  }
  
  // Module structure
  export interface Module {
    id: string;
    name: string;
    type: 'frontend' | 'backend' | 'api' | 'database' | 'full-stack';
    endpoints: ApiEndpoint[];
    components: UIComponent[];
    dependencies: string[];
    discoveredAt: Date;
  }
  
  export interface ApiEndpoint {
    url: string;
    method: string;
    summary?: string;
    parameters?: any[];
    responses?: Record<string, any>;
    tags?: string[];
    discovered_at: Date;
  }
  
  export interface UIComponent {
    id: string;
    type: 'form' | 'button' | 'link' | 'input' | 'table';
    selector: string;
    attributes: Record<string, string>;
    fields?: FormField[];
  }
  
  export interface FormField {
    name: string;
    type: string;
    required: boolean;
    validation?: string;
  }
  
  // Test case structure
  export interface TestCase {
    id: string;
    moduleId: string;
    title: string;
    type: 'UI_WORKFLOW' | 'API_CONTRACT' | 'PERFORMANCE';
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    steps: TestStep[];
    testData: Record<string, any>;
    expectedResults: string[];
    dependencies: string[];
    status: 'ACTIVE' | 'DISABLED' | 'DEPRECATED';
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface TestStep {
    step: number;
    action: string;
    expected: string;
    element?: string;
    data?: Record<string, any>;
  }
  
  // Test execution results
  export interface TestResult {
    testCaseId: string;
    status: 'PASSED' | 'FAILED' | 'FLAKY' | 'SKIPPED';
    duration: number;
    error?: string;
    stepResults?: StepResult[];
    artifacts?: {
      screenshot?: string;
      logs?: string[];
      video?: string;
    };
    executedAt: Date;
  }
  
  export interface StepResult {
    step: number;
    status: 'PASSED' | 'FAILED' | 'SKIPPED';
    duration: number;
    error?: string;
  }
  
  // Discovery results
  export interface CrawlResult {
    pages: PageInfo[];
    apiEndpoints: ApiEndpoint[];
    totalPagesFound: number;
    analysisMetadata: {
      crawlDepth: number;
      duration: number;
      errors: string[];
    };
  }
  
  export interface PageInfo {
    url: string;
    title: string;
    forms: FormInfo[];
    buttons: ButtonInfo[];
    links: LinkInfo[];
    discoveredAt: Date;
  }
  
  export interface FormInfo {
    action: string;
    method: string;
    fields: FormField[];
  }
  
  export interface ButtonInfo {
    text: string;
    id?: string;
    classes: string;
  }
  
  export interface LinkInfo {
    href: string;
    text?: string;
  }