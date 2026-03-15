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
│   └── magic-number/  # Detects duplicate literals
├── reporters/      # Output formatters
├── types/          # Type definitions
├── cli/            # Command-line interface
│   ├── bin.ts      # CLI entry point
│   └── helpers/    # File collection utilities
├── languages/      # Language-specific detectors (to be implemented)
│   ├── js/
│   ├── ts/
│   ├── vue/
│   └── svelte/
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

1. Parse files using OXC parser (`packages/core/src/core/runner.ts`)
2. Each detector's **Collector** visits AST nodes using OXC's visitor pattern
3. Extract only essential metadata (fingerprints) into `GlobalContext`
4. **Immediately discard the AST** - never keep ASTs in memory
5. Store metadata in namespaced Maps: `Map<namespace, Map<key, value>>`

### Phase 2: Analysis

1. All detectors' **Analyzers** process collected metadata from `GlobalContext`
2. Compare fingerprints across files to find duplicates
3. Generate `Report[]` with similarity scores and locations

**Key Insight**: ASTs are never kept in memory simultaneously. Only lightweight metadata survives Phase 1.

## Core Architecture

### GlobalContext (Namespaced Storage)

- **Location**: `src/core/context.ts`
- **Purpose**: Centralized metadata storage using nested Maps
- **Structure**: `Map<namespace, Map<key, value>>`
- Each detector uses its own namespace (e.g., `"magic-number"`)
- Provides `set()`, `get()`, `getAll()`, `has()`, `clear()` methods

### Detector Interface (Pluggable Modules)

- **Location**: `src/types/detector.ts`
- **Required Methods**:
  1. `createCollector(context, filePath, sourceCode)`: Returns a Collector for Phase 1
  2. `analyze(context)`: Processes collected data in Phase 2, returns `Report[]`
- **Properties**: `name`, `description`, optional `config`

### Collector Interface (AST Visitors)

- **Location**: `src/types/collector.ts`
- **Purpose**: Traverse AST and extract metadata during Phase 1
- **Key Method**: `visit(program: Program)` - receives OXC AST program
- Uses OXC's `VisitorObject` pattern (ESLint-style callbacks)
- Must NOT store AST references - only extract serializable data

### Runner (Orchestrator)

- **Location**: `src/core/runner.ts`
- Coordinates both phases synchronously
- Uses OXC's `parseSync()` - note: file path is first parameter
- Language detection: `.ts` → `"ts"`, `.tsx` → `"tsx"`, `.jsx` → `"jsx"`, `.js` → `"js"`
- Each file is parsed, visited by all collectors, then AST is discarded

## Implementing a New Detector

Follow this pattern (see `src/detectors/magic-number/` as reference):

### 1. Create Detector Files

```
src/detectors/your-detector/
├── index.ts       # Main detector class
├── collector.ts   # Phase 1: AST visitor
├── analyzer.ts    # Phase 2: Analysis logic
└── types.ts       # Type definitions
```

### 2. Collector Implementation

```typescript
import { Visitor, type VisitorObject, type Program } from "oxc-parser";

export class YourCollector implements Collector {
  private readonly namespace = "your-namespace";

  visit(program: Program): void {
    const visitorObject: VisitorObject = {
      // OXC visitor callbacks - see node types in oxc-parser types
      FunctionDeclaration: (node) => {
        // Extract metadata (NOT the AST node itself)
        const metadata = {
          /* ... */
        };
        this.context.set(this.namespace, key, metadata);
      },
    };

    const visitor = new Visitor(visitorObject);
    visitor.visit(program);
  }
}
```

### 3. Analyzer Implementation

```typescript
export class YourAnalyzer {
  async analyze(context: GlobalContext): Promise<Report[]> {
    const data = context.getAll<YourType>(this.namespace);
    // Compare data, find duplicates
    return reports;
  }
}
```

### 4. Export from Core

Add exports to:

- `src/detectors/index.ts`
- `src/index.ts`

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
const visitorObject: VisitorObject = {
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
```

## Current Detectors

### MagicNumberDetector

- **Location**: `src/detectors/magic-number/`
- **Namespace**: `"magic-number"`
- **Purpose**: Finds duplicate literal values (numbers, strings, booleans, bigints)
- **Configuration**: `minOccurrences` (default: 3)
- **Skip Logic**: Ignores 0, 1, -1, small integers 2-10, and strings < 3 chars

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

## Testing CLI Output

Test files are in `test-files/`:

```bash
node packages/cli/dist/index.js 'test-files/**/*.ts'
```

Expected output shows:

- File paths with line:column positions
- Code snippets with context
- Similarity scores
- Remediation suggestions
