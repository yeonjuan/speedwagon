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

See `.claude/rules/code-style.md` for detailed examples.

## Project Overview

A scalable structural code duplicate detector using a memory-efficient Two-Phase Analysis approach. The tool parses JavaScript/TypeScript files using OXC parser, extracts metadata without keeping ASTs in memory, and identifies duplicates through pattern matching.

**Key Goal**: Handle large-scale projects without Out of Memory (OOM) issues by separating metadata collection from similarity analysis.

## Project Structure

```
src/
├── core/           # Core engine
│   ├── context.ts  # GlobalContext implementation
│   └── runner.ts   # Two-Phase analysis orchestrator
├── rules/          # Built-in rules
│   ├── union-type/
│   ├── string-literal/
│   ├── string-interpolation/
│   ├── regex-literal/
│   ├── logical-expression/
│   └── function-definition/
├── languages/      # Language-specific parsers (js/jsx/ts/tsx)
├── reporters/      # Output formatters
├── types/          # Type definitions
├── constants/      # Shared constants
├── cli/            # CLI entry point
├── test-utils/     # RuleTester for integration tests
└── index.ts        # Main library exports
```

**Prerequisites**: Node.js >= 20.19.0 or >= 22.12.0, pnpm >= 9.0.0

## Common Commands

```bash
pnpm install       # Install dependencies
pnpm build         # Build the project
pnpm dev           # Watch mode
pnpm clean         # Clean build artifacts
pnpm format        # Format code
pnpm test          # Run all tests

node dist/cli/bin.js 'src/**/*.ts'  # Run CLI
```

## Two-Phase Architecture (Critical Concept)

### Phase 1: Collection
1. `Runner` creates a `RuleContext` per rule
2. Files are read and parsed via language-specific parsers (`src/languages/`)
3. Each rule's `createVisitor` visits AST nodes, calling `context.addInfo()` to store metadata
4. AST is discarded after visiting

### Phase 2: Analysis & Report
1. `Runner` calls `rule.report(context)` for each rule
2. Rule compares stored infos, returns `Report[]`
3. Reports are passed to the reporter for output

**Key Insight**: ASTs are never kept in memory simultaneously. Only lightweight metadata survives Phase 1.

## Core Architecture

### GlobalContext (`src/core/context.ts`)
- Factory for `RuleContext` instances
- `createRuleContext(namespace)`: Creates isolated context per rule
- Internal storage: `Map<namespace, Map<key, RuleInfo[]>>`

### RuleContext (`src/types/context.ts`)
- `addInfo(key, id, location, snippet, data)`: Store metadata entry
- `getAllInfos<T>()`: Returns `Map<key, RuleInfo<T>[]>` for analysis

### Rule Interface (`src/types/rule.ts`)
- `name`: Identifier
- `description`: Human-readable description
- `createVisitor`: `VisitorFactory` — created via `createRule()` utility
- `report(context)`: Analyze collected data, return `Report[]`

### Runner (`src/core/runner.ts`)
- Accepts `rules`, `files`, optional `reporter` and `verbose`
- Detects language from file extension, delegates to `src/languages/`
- Calls `rule.createVisitor(context, filePath, sourceCode)` → `visitorObj.visitor().visit(program)`

### createRule utility (`src/utils/create-rule.ts`)
Wraps a raw `VisitorObject` factory into a `VisitorFactory`:
```typescript
export const myRule = createRule(
  (context, filePath, sourceCode) => ({
    SomeAstNode: (node) => {
      context.addInfo(key, id, location, snippet, data);
    },
  }),
);
```

## Implementing a New Rule

### File Structure
```
src/rules/your-rule/
├── index.ts       # Rule factory
├── rule.ts        # createRule() visitor logic
├── types.ts       # Type definitions
└── index.spec.ts  # Integration tests
```

### Rule Implementation
```typescript
// rule.ts
import { createRule, getPosition, extractSnippet } from "../../utils/index.js";
import type { YourInfo } from "./types.js";

export const yourRule = createRule(
  (context, filePath, sourceCode) => {
    let counter = 0;
    return {
      SomeNode: (node) => {
        const id = `${filePath}:${counter++}`;
        const location = {
          file: filePath,
          start: getPosition(sourceCode, node.start),
          end: getPosition(sourceCode, node.end),
        };
        const snippet = extractSnippet(sourceCode, location, { expandLines: 1 });
        context.addInfo(key, id, location, snippet, { /* data */ });
      },
    };
  },
);
```

### Rule Factory
```typescript
// index.ts
import type { Rule, RuleConfig, RuleContext, Report } from "../../types/index.js";
import { yourRule } from "./rule.js";

export function createYourRule(config: RuleConfig = {}): Rule {
  const minOccurrences = config.minOccurrences ?? 2;
  return {
    name: "your-rule",
    description: "...",
    createVisitor: yourRule,
    report: (context: RuleContext): Report[] => {
      const reports: Report[] = [];
      for (const [key, duplicates] of context.getAllInfos().entries()) {
        if (duplicates.length >= minOccurrences) {
          reports.push({ type: "your-rule", description: "...", duplicates: [] });
        }
      }
      return reports;
    },
  };
}
```

### Integration Tests
```typescript
import { describe, it, expect } from "vitest";
import { RuleTester } from "../../test-utils/index.js";
import { createYourRule } from "./index.js";

describe("YourRule", () => {
  it("should detect duplicates", async () => {
    const tester = new RuleTester(createYourRule({ minOccurrences: 2 }));
    const reports = await tester.testSingleFile(`/* your code */`);
    expect(reports).toHaveLength(1);
  });
});
```

### Export from Core
Add to `src/index.ts`:
```typescript
export * from "./rules/your-rule/index.js";
```

## OXC Parser Specifics

- API: `parseSync(filename, sourceText, options)` — filename is **first** parameter
- Language options: `{ lang: "js" | "jsx" | "ts" | "tsx" }`
- All literals have `type: "Literal"` — distinguish by `typeof node.value`
- Use `node.start` / `node.end` for positions (not `node.span`)
- Visitor pattern via `VisitorObject` callbacks; wrap in `new Visitor(visitorObject)` to get `.visit()`

## Current Rules

| Name | Description | Default minOccurrences |
|------|-------------|----------------------|
| `union-type` | Duplicate TypeScript union types | 2 |
| `string-literal` | Duplicate string literals (≥3 chars) | 3 |
| `string-interpolation` | Duplicate template literal structures | 2 |
| `regex-literal` | Duplicate regular expressions | 2 |
| `logical-expression` | Duplicate logical expressions | 2 |
| `function-definition` | Structurally duplicate function bodies | 2 |

## TypeScript Configuration

- `"type": "module"` — all imports need `.js` extension (even for `.ts` files)
- `"module": "ES2022"`, `"moduleResolution": "bundler"`

## Report Format

```typescript
interface Report {
  type: string;           // rule name
  description: string;
  suggestion?: string;
  duplicates: DuplicateEntry[];  // each with location, snippet, metadata
}
```

## Testing

```bash
pnpm test                          # All tests
pnpm test src/rules/your-rule      # Specific rule
```

Use `RuleTester` for integration tests.
