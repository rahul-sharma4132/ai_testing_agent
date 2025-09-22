# AI Testing Agent

An intelligent, AI-powered testing automation platform that automatically discovers, analyzes, and generates comprehensive test cases for web applications, APIs, and databases.

## 🚀 Overview

The AI Testing Agent is a sophisticated testing framework that combines artificial intelligence with traditional testing methodologies to provide:

- **Automated Discovery**: Intelligent crawling and analysis of web applications and APIs
- **AI-Driven Test Generation**: Automatic creation of comprehensive test suites
- **Multi-Platform Support**: Testing for frontend, backend, APIs, and databases
- **Intelligent Execution**: Smart test execution with failure analysis and reporting

## 📋 Features

### 🔍 Discovery & Analysis
- **Web Application Crawling**: Automatically discovers pages, forms, buttons, and navigation flows
- **API Endpoint Detection**: Identifies and catalogs REST API endpoints with parameters and responses
- **Component Analysis**: Analyzes UI components and their interactions
- **Dependency Mapping**: Maps relationships between different application modules

### 🧪 Test Generation
- **UI Workflow Tests**: Generates end-to-end user journey tests
- **API Contract Tests**: Creates comprehensive API validation tests  
- **Performance Tests**: Automated performance and load testing scenarios
- **Data-Driven Tests**: Generates tests with realistic test data

### ⚡ Execution & Reporting
- **Multi-Browser Support**: Tests across Chromium, Firefox, and WebKit
- **Parallel Execution**: Concurrent test execution for faster feedback
- **Rich Artifacts**: Screenshots, videos, and detailed logs on failures
- **Intelligent Retry**: Smart retry mechanism for flaky tests

## 🏗️ Architecture

This project is organized as a monorepo with the following structure:

```
ai_testing_agent/
├── packages/                    # Core libraries
│   ├── core/                   # Core types and utilities
│   ├── discovery/              # Application discovery engine
│   ├── test-generator/         # AI-powered test generation
│   ├── automation/             # Test execution engine
│   └── storage/                # Data persistence layer
├── apps/                       # Applications
│   ├── cli/                    # Command-line interface
│   ├── api/                    # REST API server
│   └── web-ui/                 # Web dashboard
└── docs/                       # Documentation
```

### Core Components

- **🎯 Core Package**: Shared types, configuration, and utilities
- **🔎 Discovery Engine**: Intelligent application analysis and mapping
- **🤖 Test Generator**: AI-powered test case creation
- **⚙️ Automation Engine**: Test execution and result collection
- **💾 Storage Layer**: Persistent storage for applications, tests, and results

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- pnpm 8+
- TypeScript 5+

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd ai_testing_agent

# Install dependencies
pnpm install

# Build all packages
pnpm turbo build
```

### Basic Usage

```bash
# Analyze an application
pnpm analyze --url https://your-app.com

# Generate tests
pnpm generate-tests --app-id <app-id>

# Run tests
pnpm run-tests --suite <suite-id>
```

## 📊 Supported Test Types

| Type | Description | Scope |
|------|-------------|-------|
| **UI_WORKFLOW** | End-to-end user journeys | Frontend |
| **API_CONTRACT** | API validation and contract testing | Backend |
| **PERFORMANCE** | Load and performance testing | Full-stack |

## 🔧 Configuration

### Application Configuration

```typescript
const config: ApplicationConfig = {
  name: "My App",
  url: "https://myapp.com",
  discoverySettings: {
    maxDepth: 3,
    excludePatterns: ['/admin', '/debug'],
    includeAPIs: true,
    timeout: 30000
  }
};
```

### Discovery Settings

- **maxDepth**: Maximum crawl depth (default: 3)
- **excludePatterns**: URL patterns to exclude from discovery
- **includeAPIs**: Whether to discover API endpoints
- **timeout**: Request timeout in milliseconds

### Testing Configuration

- **retryAttempts**: Number of retry attempts for failed tests
- **screenshotOnFailure**: Capture screenshots on test failures
- **videoRecording**: Record test execution videos
- **parallelExecutions**: Number of parallel test executions

## 🎨 Test Case Structure

```typescript
interface TestCase {
  id: string;
  moduleId: string;
  title: string;
  type: 'UI_WORKFLOW' | 'API_CONTRACT' | 'PERFORMANCE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  steps: TestStep[];
  testData: Record<string, any>;
  expectedResults: string[];
}
```

## 🔍 Discovery Results

The discovery engine provides comprehensive analysis results:

```typescript
interface CrawlResult {
  pages: PageInfo[];           // Discovered pages
  apiEndpoints: ApiEndpoint[]; // API endpoints found
  totalPagesFound: number;     // Total pages discovered
  analysisMetadata: {
    crawlDepth: number;
    duration: number;
    errors: string[];
  };
}
```

## 📈 Test Execution Results

Detailed test execution reporting:

```typescript
interface TestResult {
  testCaseId: string;
  status: 'PASSED' | 'FAILED' | 'FLAKY' | 'SKIPPED';
  duration: number;
  artifacts?: {
    screenshot?: string;
    logs?: string[];
    video?: string;
  };
}
```

## 🛠️ Development

### Building

```bash
# Build all packages
pnpm turbo build

# Build specific package
pnpm --filter @ai-testing-agent/core build
```

### Testing

```bash
# Run all tests
pnpm turbo test

# Run tests for specific package
pnpm --filter @ai-testing-agent/core test
```

### Development Mode

```bash
# Start development mode
pnpm turbo dev
```

## 🌐 Browser Support

| Browser | Support | Notes |
|---------|---------|-------|
| Chromium | ✅ Full | Default browser |
| Firefox | ✅ Full | Cross-browser validation |
| WebKit | ✅ Full | Safari compatibility |

## 📚 API Reference

### Core Types

- `ApplicationConfig` - Application configuration interface
- `TestCase` - Test case structure and metadata
- `TestResult` - Test execution results and artifacts
- `CrawlResult` - Discovery and analysis results

### Configuration Constants

- `DEFAULT_CONFIG` - Default configuration values
- `SUPPORTED_BROWSERS` - Array of supported browser types
- `LogLevel` - Logging level enumeration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📧 Email: support@ai-testing-agent.com
- 📖 Documentation: [docs.ai-testing-agent.com](https://docs.ai-testing-agent.com)
- 🐛 Issues: [GitHub Issues](https://github.com/your-org/ai_testing_agent/issues)

## 🎯 Roadmap

- [ ] Machine Learning-powered test optimization
- [ ] Visual regression testing
- [ ] Mobile application support
- [ ] Cloud deployment integration
- [ ] Advanced AI test generation models

---

**Built with ❤️ by the QA Engineering Team**