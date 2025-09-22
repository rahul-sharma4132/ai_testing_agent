# Node.js Developer Reference Guide
*Essential JavaScript, ES Modules, and TypeScript Rules*

## 📚 Table of Contents
1. [JavaScript Fundamentals](#javascript-fundamentals)
2. [ES Modules (ESM) Rules](#es-modules-esm-rules)
3. [TypeScript Best Practices](#typescript-best-practices)
4. [Node.js Specific Guidelines](#nodejs-specific-guidelines)
5. [Package.json Configuration](#packagejson-configuration)
6. [Common Pitfalls & Solutions](#common-pitfalls--solutions)
7. [Quick Reference Cheatsheet](#quick-reference-cheatsheet)

---

## 🟨 JavaScript Fundamentals

### **Variable Declarations**
```javascript
// ✅ Use const by default
const API_URL = 'https://api.example.com';
const users = [];

// ✅ Use let for reassignment
let currentUser = null;
currentUser = { id: 1, name: 'John' };

// ❌ Avoid var (function-scoped, hoisting issues)
var oldStyle = 'avoid this';
```

### **Function Declarations**
```javascript
// ✅ Arrow functions for callbacks and short functions
const processData = (data) => data.map(item => item.value);

// ✅ Function declarations for main functions (hoisted)
function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// ✅ Async/await over Promises
async function fetchUser(id) {
  try {
    const response = await fetch(`/api/users/${id}`);
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw error;
  }
}
```

### **Object and Array Patterns**
```javascript
// ✅ Destructuring
const { name, email } = user;
const [first, second, ...rest] = array;

// ✅ Spread operator
const newUser = { ...user, lastLogin: new Date() };
const allItems = [...existingItems, ...newItems];

// ✅ Optional chaining
const city = user?.address?.city;
const firstItem = items?.[0];

// ✅ Nullish coalescing
const displayName = user.name ?? 'Anonymous';
const port = process.env.PORT ?? 3000;
```

---

## 🟦 ES Modules (ESM) Rules

### **Basic Import/Export Syntax**
```javascript
// ✅ Named exports
export const CONFIG = { port: 3000 };
export function helper() { /* ... */ }
export class MyClass { /* ... */ }

// ✅ Default exports
export default class Application {
  // Main class
}

// ✅ Named imports
import { CONFIG, helper } from './utils.js';

// ✅ Default imports
import Application from './App.js';

// ✅ Mixed imports
import Application, { CONFIG, helper } from './App.js';

// ✅ Namespace imports
import * as utils from './utils.js';
```

### **🚨 Critical ESM Rules**

#### **1. File Extensions Are Required**
```javascript
// ✅ Always include .js extension for relative imports
import { logger } from './logger.js';
import { config } from '../config.js';

// ❌ Will not work in ESM
import { logger } from './logger';
import { config } from '../config';

// ✅ External packages don't need extensions
import express from 'express';
import { readFile } from 'fs/promises';
```

#### **2. Directory Structure Matters**
```
src/
├── index.js
├── utils/
│   ├── logger.js
│   └── config.js
└── services/
    └── api.js
```

```javascript
// From index.js
import { logger } from './utils/logger.js';     // ✅ Relative path
import { ApiService } from './services/api.js'; // ✅ Relative path

// From utils/logger.js  
import { config } from './config.js';           // ✅ Same directory
import { ApiService } from '../services/api.js'; // ✅ Up and down
```

#### **3. Top-Level Await**
```javascript
// ✅ Allowed in ESM (Node.js 14.8+)
const config = await import('./config.js');
const data = await fetch('/api/data');

// ✅ But wrap in async function for better error handling
async function initialize() {
  try {
    const config = await import('./config.js');
    // ... rest of initialization
  } catch (error) {
    console.error('Initialization failed:', error);
  }
}
```

#### **4. Dynamic Imports**
```javascript
// ✅ Conditional imports
if (process.env.NODE_ENV === 'development') {
  const { devTools } = await import('./dev-tools.js');
  devTools.setup();
}

// ✅ Lazy loading
async function loadPlugin(pluginName) {
  const plugin = await import(`./plugins/${pluginName}.js`);
  return plugin.default;
}
```

---

## 🟩 TypeScript Best Practices

### **TypeScript + ES Modules**
```typescript
// ✅ Import .js extensions in TypeScript files
import { User } from './types.js';        // .js not .ts!
import { logger } from './logger.js';     // .js not .ts!
import { config } from './config.js';     // .js not .ts!

// ✅ Type-only imports
import type { ApiResponse } from './api.js';
import type { Config } from './config.js';
```

### **Configuration Rules**
```json
// tsconfig.json
{
  "compilerOptions": {
    // ✅ For Node.js ESM projects
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    
    // ✅ Essential settings
    "strict": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    
    // ✅ Output settings
    "outDir": "./dist",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

### **Type Definitions**
```typescript
// ✅ Interface for object shapes
interface User {
  readonly id: string;
  name: string;
  email: string;
  createdAt: Date;
}

// ✅ Type for unions and primitives
type Status = 'pending' | 'approved' | 'rejected';
type UserId = string;

// ✅ Generic types
interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
}

// ✅ Utility types
type PartialUser = Partial<User>;
type UserEmail = Pick<User, 'email'>;
type CreateUser = Omit<User, 'id' | 'createdAt'>;
```

### **Function Typing**
```typescript
// ✅ Function signatures
function processUser(user: User): Promise<User> {
  return updateDatabase(user);
}

// ✅ Arrow function typing
const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// ✅ Async function typing
async function fetchUsers(): Promise<User[]> {
  const response = await fetch('/api/users');
  return response.json();
}

// ✅ Callback typing
function processItems<T>(
  items: T[], 
  callback: (item: T) => void
): void {
  items.forEach(callback);
}
```

---

## 🟪 Node.js Specific Guidelines

### **Package.json Configuration**
```json
{
  "name": "my-app",
  "type": "module",                    // ✅ Required for ESM
  "engines": {
    "node": ">=18.0.0"                 // ✅ Specify Node version
  },
  "main": "./dist/index.js",           // ✅ Compiled output
  "types": "./dist/index.d.ts",        // ✅ TypeScript definitions
  "exports": {                         // ✅ Modern exports
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "tsc --watch"
  }
}
```

### **Environment Variables**
```javascript
// ✅ Use process.env with defaults
const PORT = process.env.PORT ?? 3000;
const NODE_ENV = process.env.NODE_ENV ?? 'development';

// ✅ Type environment variables in TypeScript
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PORT?: string;
      DATABASE_URL: string;
      JWT_SECRET: string;
    }
  }
}
```

### **Error Handling**
```javascript
// ✅ Async error handling
async function safeOperation() {
  try {
    const result = await riskyOperation();
    return { success: true, data: result };
  } catch (error) {
    console.error('Operation failed:', error);
    return { success: false, error: error.message };
  }
}

// ✅ Process error handlers
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
```

---

## 🔧 Package.json Configuration

### **Essential Fields**
```json
{
  "type": "module",                    // ✅ Enable ESM
  "engines": { "node": ">=18" },       // ✅ Node version
  "packageManager": "pnpm@8.0.0",     // ✅ Lock package manager
  "scripts": {
    "build": "tsc",                   // ✅ TypeScript build
    "start": "node dist/index.js",    // ✅ Production start
    "dev": "tsx watch src/index.ts",  // ✅ Development
    "test": "vitest",                 // ✅ Testing
    "lint": "eslint src/**/*.ts",     // ✅ Linting
    "type-check": "tsc --noEmit"      // ✅ Type checking
  }
}
```

### **Workspace Configuration (Monorepos)**
```yaml
# pnpm-workspace.yaml
packages:
  - 'packages/*'
  - 'apps/*'
```

```json
// Root package.json
{
  "name": "my-monorepo",
  "private": true,
  "type": "module",
  "workspaces": ["packages/*", "apps/*"],
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "test": "turbo run test"
  }
}
```

---

## ⚠️ Common Pitfalls & Solutions

### **1. Module Resolution Issues**
```javascript
// ❌ Common mistake
import { utils } from './utils';       // Missing .js extension

// ✅ Correct
import { utils } from './utils.js';    // Always .js for relative imports
```

### **2. Default vs Named Exports**
```javascript
// ❌ Mixed export styles in same file
export default class User {}
export const CONFIG = {};

// ✅ Consistent approach - choose one
// Option A: Named exports only
export class User {}
export const CONFIG = {};

// Option B: Default export with named
export default class User {}
export { CONFIG };
```

### **3. TypeScript Import Extensions**
```typescript
// ❌ Wrong extension
import { User } from './types.ts';     // Don't use .ts

// ✅ Correct extension  
import { User } from './types.js';     // Always .js for local imports
```

### **4. Async/Await vs Promises**
```javascript
// ❌ Promise chaining
function fetchData() {
  return fetch('/api')
    .then(response => response.json())
    .then(data => processData(data))
    .catch(error => handleError(error));
}

// ✅ Async/await
async function fetchData() {
  try {
    const response = await fetch('/api');
    const data = await response.json();
    return processData(data);
  } catch (error) {
    handleError(error);
    throw error;
  }
}
```

### **5. Environment Configuration**
```javascript
// ❌ No fallbacks
const port = process.env.PORT;
const dbUrl = process.env.DATABASE_URL;

// ✅ Always provide defaults/validation
const port = Number(process.env.PORT) || 3000;
const dbUrl = process.env.DATABASE_URL ?? 
  (() => { throw new Error('DATABASE_URL is required') })();
```

---

## 🚀 Quick Reference Cheatsheet

### **File Extensions**
| Context | Extension | Example |
|---------|-----------|---------|
| TypeScript source | `.ts` | `user.ts` |
| JavaScript source | `.js` | `user.js` |
| TypeScript imports | `.js` | `import './user.js'` |
| External packages | none | `import 'express'` |

### **Import Patterns**
```javascript
// Relative imports (always .js)
import { local } from './file.js';
import { parent } from '../parent.js';
import { nested } from './dir/file.js';

// External packages (no extension)
import express from 'express';
import { readFile } from 'fs/promises';

// Node.js built-ins (no extension)
import path from 'path';
import { createServer } from 'http';
```

### **Package.json Essentials**
```json
{
  "type": "module",              // ESM mode
  "main": "./dist/index.js",     // Entry point
  "types": "./dist/index.d.ts",  // TypeScript types
  "engines": { "node": ">=18" }, // Node version
  "exports": {                   // Modern exports
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  }
}
```

### **TypeScript Config Essentials**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "outDir": "./dist",
    "declaration": true
  }
}
```

---

## 🎯 Development Workflow

### **1. Project Setup**
```bash
# Initialize project
npm init -y
# or
pnpm init

# Add type: module to package.json
# Install TypeScript
pnpm add -D typescript @types/node

# Initialize TypeScript
npx tsc --init
```

### **2. File Structure**
```
src/
├── index.ts          # Entry point
├── types/
│   └── index.ts       # Type definitions
├── utils/
│   ├── logger.ts      # Utilities
│   └── config.ts      # Configuration
└── services/
    └── api.ts         # Business logic
```

### **3. Build & Run**
```bash
# Development
pnpm run dev           # Watch mode

# Build
pnpm run build         # Compile TypeScript

# Production
pnpm start            # Run compiled JavaScript
```

---

## 📝 Final Tips

1. **Always use `.js` extensions** for relative imports in TypeScript ESM projects
2. **Be consistent** with export styles (default vs named)
3. **Use `type: "module"`** in package.json for ESM
4. **Prefer async/await** over Promise chaining
5. **Validate environment variables** with defaults
6. **Use strict TypeScript settings** for better code quality
7. **Configure ESLint and Prettier** for consistent code style
8. **Use workspace configurations** for monorepos
9. **Always handle errors** in async functions
10. **Keep dependencies up to date** but pin versions for stability

---

*Save this file as a reference and update it as you learn new patterns and best practices!* 📚✨
