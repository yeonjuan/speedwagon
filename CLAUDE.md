# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Code Style Guidelines

**IMPORTANT**: This codebase follows a clean, minimal commenting style.

### Comment Rules

- **Do NOT add unnecessary comments**
- **Do NOT add JSDoc comments** for obvious functions, methods, or properties
- **Do NOT add inline comments** explaining what code does (code should be self-explanatory)
- Only add comments for:
  - Complex algorithms requiring explanation
  - Non-obvious business logic
  - Workarounds for bugs
  - Critical architecture decisions

### Code Organization

- Keep code clean and self-documenting
- Use descriptive names instead of comments
- TypeScript types document intent - avoid redundant annotations

See `.claude/rules/code-style.md` for detailed examples.

## Project Overview

A scalable structural code duplicate detector using a memory-efficient Two-Phase Analysis approach. The tool parses JavaScript/TypeScript files using OXC parser, extracts metadata without keeping ASTs in memory, and identifies duplicates through pattern matching.

**Key Goal**: Handle large-scale projects without Out of Memory (OOM) issues by separating metadata collection from similarity analysis.

## Project Structure

```
src/
├── core/           # Core duplicate detection engine
│   ├── context.ts  # GlobalContext implementation
│   └── runner.ts   # Two-Phase analysis orchestrator
├── detectors/      # Built-in detectors
│   ├── union-type/      # Detects duplicate union types
│   └── string-literal/  # Detects duplicate string literals
├── reporters/      # Output formatters
├── types/          # Type definitions
├── cli/            # Command-line interface
│   ├── bin.ts      # CLI entry point
│   └── cli.ts      # CLI implementation
├── test-utils/     # Testing utilities
│   └── detector-tester.ts  # DetectorTester for integration tests
└── index.ts        # Main library exports
```

**Prerequisites**: Node.js >= 20.19.0 or >= 22.12.0, pnpm >= 9.0.0

## Common Commands

```bash
# Install dependencies
pnpm install

# Build the project
pnpm build

# Watch mode
pnpm dev

# Clean build artifacts
pnpm clean

# Format code
pnpm format

# Run CLI
node dist/cli/bin.js 'src/**/*.ts'
```

## Two-Phase Architecture (Critical Concept)

This architecture is central to how the system works and affects all detector implementations:

### Phase 1: Collection (Memory-Efficient)

1. Create `DetectorContext` for each detector
2. Parse files using OXC parser (`src/core/runner.ts`)
3. Each detector's **Collector** visits AST nodes using OXC's visitor pattern
4. Extract only essential metadata (fingerprints) into `DetectorContext`
5. **Immediately discard the AST** - never keep ASTs in memory

### Phase 2: Analysis

1. Create `ReportContext` to collect all reports
2. For each detector:
   - Run analyzer with `collectContext` and `reportContext`
   - Analyzer adds reports to `reportContext`
   - Clear `collectContext` to free memory
3. Pass `reportContext` to reporter for output

**Key Insight**: ASTs are never kept in memory simultaneously. Only lightweight metadata survives Phase 1, and collect contexts are cleared after analysis.

## Core Architecture

### GlobalContext

- **Location**: `src/core/context.ts`
- **Purpose**: Factory for creating detector-specific and report contexts
- **Methods**:
  - `createDetectorContext(namespace)`: Creates isolated context for a detector
  - `createReportContext()`: Creates context for collecting reports
  - Internal storage using nested Maps: `Map<namespace, Map<key, value>>`

### DetectorContext

- **Location**: `src/types/context.ts`
- **Purpose**: Isolated storage for each detector's collected metadata
- **Methods**: `set()`, `get()`, `getAll()`, `has()`, `clear()`
- Each detector gets its own context with namespace already bound

### ReportContext

- **Location**: `src/types/context.ts`
- **Purpose**: Collects all reports from analyzers
- **Methods**:
  - `addReport(report)`: Add a report
  - `getReports()`: Get all collected reports

### Detector Interface (Pluggable Modules)

- **Location**: `src/types/detector.ts`
- **Required**:
  - `name`: Detector identifier
  - `description`: Human-readable description
  - `createCollector`: Factory function from `createCollector()` utility
  - `analyze(collectContext, reportContext)`: Processes collected data, adds reports to reportContext
- **Optional**: `config` object

### CollectorFactory

- **Location**: `src/utils/create-collector.ts`
- **Purpose**: Creates collector functions that return VisitorObject
- **Pattern**: `createCollector((context, filePath, sourceCode) => ({ VisitorObject }))`
- Returns VisitorObject directly (not wrapped in visitor() method)

### Runner (Orchestrator)

- **Location**: `src/core/runner.ts`
- Coordinates both phases:
  - `collectMetadata()`: Runs all collectors on all files
  - `analyzeAndReport()`: Runs analyzers, clears collect contexts
- Uses OXC's `parseSync()` - note: file path is first parameter
- Language detection: `.ts` → `"ts"`, `.tsx` → `"tsx"`, `.jsx` → `"jsx"`, `.js` → `"js"`
- Each file is parsed, visited by all collectors, then AST is discarded

## Implementing a New Detector

Follow this pattern (see `src/detectors/union-type/` or `src/detectors/string-literal/` as reference):

### 1. Create Detector Files

```
src/detectors/your-detector/
├── index.ts       # Detector factory function
├── collector.ts   # Collection logic (returns VisitorObject)
├── analyzer.ts    # Analysis logic (adds reports to ReportContext)
├── types.ts       # Type definitions
└── index.spec.ts  # Integration tests using DetectorTester
```

### 2. Collector Implementation

```typescript
import { getPosition, createCollector } from "../../utils/index.js";
import type { YourInfo } from "./types.js";

export const yourCollector = createCollector(
  (context, filePath, sourceCode) => {
    let counter = 0;

    return {
      // OXC visitor callbacks - see node types in oxc-parser types
      FunctionDeclaration: (node) => {
        // Extract metadata (NOT the AST node itself)
        const existing = context.get<YourInfo[]>(key) ?? [];
        const info: YourInfo = {
          id: `${filePath}:${counter++}`,
          // ... your metadata
          location: {
            file: filePath,
            start: getPosition(sourceCode, node.start),
            end: getPosition(sourceCode, node.end),
          },
        };
        existing.push(info);
        context.set(key, existing);
      },
    };
  },
);
```

### 3. Analyzer Implementation

```typescript
import type {
  DetectorContext,
  ReportContext,
  Report,
} from "../../types/index.js";
import type { YourInfo } from "./types.js";

export function createAnalyzer(minOccurrences: number = 2) {
  return async (
    collectContext: DetectorContext,
    reportContext: ReportContext,
  ): Promise<void> => {
    const allData = collectContext.getAll<YourInfo[]>();

    // Compare data, find duplicates
    const reports: Report[] = [];
    // ... your analysis logic

    reports.sort((a, b) => b.duplicates.length - a.duplicates.length);

    for (const report of reports) {
      reportContext.addReport(report);
    }
  };
}
```

### 4. Detector Factory

```typescript
import type { Detector, DetectorConfig } from "../../types/index.js";
import { yourCollector } from "./collector.js";
import { createAnalyzer } from "./analyzer.js";

export interface YourDetectorConfig extends DetectorConfig {
  minOccurrences?: number;
}

export function createYourDetector(config?: YourDetectorConfig): Detector {
  const minOccurrences = config?.minOccurrences ?? 2;

  return {
    name: "your-detector",
    description: "Description of what this detector does",
    createCollector: yourCollector,
    analyze: createAnalyzer(minOccurrences),
    config,
  };
}
```

### 5. Integration Tests

```typescript
import { describe, it, expect } from "vitest";
import { createYourDetector } from "./index.js";
import { DetectorTester } from "../../test-utils/index.js";

describe("YourDetector", () => {
  const detector = createYourDetector({ minOccurrences: 2 });

  it("should detect duplicates", async () => {
    const tester = new DetectorTester(detector);
    const reports = await tester.testSingleFile(`
      // your test code
    `);

    expect(reports).toHaveLength(1);
    expect(reports[0].duplicates).toHaveLength(2);
  });
});
```

### 6. Export from Core

Add export to `src/index.ts`:

```typescript
export { createYourDetector } from "./detectors/your-detector/index.js";
```

## OXC Parser Specifics

**Why OXC**: Replaced SWC parser due to critical offset accumulation bug. OXC provides accurate span positions.

**Key Differences from SWC**:

- API: `parseSync(filename, sourceText, options)` - filename is FIRST parameter
- Returns: `ParseResult` with `.program`, `.errors`, `.comments`
- Language options: `{ lang: "js" | "jsx" | "ts" | "tsx" }`
- All literals have `type: "Literal"` - distinguish by `typeof node.value`
- Visitor pattern: Use `VisitorObject` with callbacks, not class extension

**Visitor Pattern**:

```typescript
// Return VisitorObject directly from createCollector factory
export const yourCollector = createCollector(
  (context, filePath, sourceCode) => {
    return {
      Literal: (node) => {
        /* called for all literals */
      },
      FunctionDeclaration: (node) => {
        /* ... */
      },
      "FunctionDeclaration:exit": (node) => {
        /* called on exit */
      },
    };
  },
);
```

**Note**: Use `node.start` and `node.end` for positions (not `node.span.start`/`node.span.end`).

## Current Detectors

### UnionTypeDetector

- **Location**: `src/detectors/union-type/`
- **Name**: `"union-type"`
- **Purpose**: Finds duplicate TypeScript union types
- **Configuration**: `minOccurrences` (default: 2)
- **Features**:
  - Normalizes union types by sorting members
  - Detects duplicates regardless of member order
  - Handles string literals, type references, keyword types, null, undefined

### StringLiteralDetector

- **Location**: `src/detectors/string-literal/`
- **Name**: `"string-literal"`
- **Purpose**: Finds duplicate string literals in code
- **Configuration**: `minOccurrences` (default: 3)
- **Features**:
  - Detects literals in variable declarations, function calls, return statements, binary expressions
  - Tracks context (variable vs expression)
  - Skip Logic: Ignores strings < 3 characters

## TypeScript Configuration

**Module System**:

- `"type": "module"` in package.json
- `"module": "ES2022"` in tsconfig.json
- `"moduleResolution": "bundler"`
- Import paths must include `.js` extension (even for `.ts` files)

## Report Format

All detectors return `Report[]` with:

- `type`: Detector identifier (e.g., `"magic-number"`)
- `similarity`: 0-100 score
- `duplicates`: Array of `DuplicateEntry` with location, snippet, metadata
- `description`: Human-readable summary
- `suggestion`: Optional remediation advice

## Testing

### Unit/Integration Tests

Use `DetectorTester` for testing detectors:

```typescript
import { DetectorTester } from "../../test-utils/index.js";

const tester = new DetectorTester(detector);
const reports = await tester.testSingleFile(`your code here`);
```

Run tests:

```bash
pnpm test                    # Run all tests
pnpm test src/detectors/your-detector  # Run specific detector tests
```

### CLI Testing

Test files are in `test-files/`:

```bash
node dist/cli/bin.js 'test-files/**/*.ts'
```

Expected output shows:

- File paths with line:column positions
- Code snippets with context
- Similarity scores (always 100% for exact duplicates)
- Remediation suggestions
- Summary of duplications found
