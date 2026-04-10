# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm build          # compile TypeScript (tsconfig.build.json)
pnpm dev            # watch mode
pnpm ts             # type-check only (tsc --noEmit)
pnpm test           # run all tests with vitest
pnpm format         # format with prettier (run after every code change)
pnpm knip           # find unused exports/files
```

Run a single test file:

```bash
pnpm test src/cli/collect-files.spec.ts
```

## Architecture

This tool detects duplicate code patterns in JS/TS files using a **two-phase approach** to avoid OOM on large codebases: ASTs are parsed and immediately discarded after metadata extraction.

### Two-Phase Flow

**Phase 1 — Collection**: `Runner` iterates over files, parses each with `oxc-parser` via a `Language`, and runs each `Collector`'s AST visitor. Visitors call `CollectorMutationAPI.add()` to store extracted metadata into the `CollectorContext` map. AST is never retained.

**Phase 2 — Analysis**: `Runner` calls `rule.check(ruleContext, collectorContexts)` for each rule. Rules query `CollectorContext` (via `keys()` / `getByKey()`) to find duplicates and call `ruleContext.report()`.

### Key Abstractions

- **`Collector`** (`src/collectors/types.ts`): Defines an AST visitor factory (`createJSVisitor`). All built-in collectors live in `src/collectors/`.
- **`CollectorContext`** (`src/collectors/collector-context.ts`): Stores collected metadata in a nested `Map<key, Map<path, CollectRecord[]>>`. Exposes `mutationApi()` for writing (used during Phase 1) and `keys()` / `getByKey()` / `entries()` for reading (used during Phase 2).
- **`Rule`** (`src/rules/types.ts`): Generic over its `collectors` tuple — `check()` receives a typed array of `CollectorContext` matching the rule's collectors. Reports use string IDs mapped to template strings in `descriptions` / `suggestions` (supports `{{variable}}` interpolation from `data`).
- **`RuleContext`** (`src/rules/rule-context.ts`): Passed to `rule.check()` so rules can call `report()`.
- **`Runner`** (`src/runner/runner.ts`): Deduplicates collectors across rules, creates one `CollectorContext` per collector and one `RuleContext` per rule.
- **`Language`** (`src/languages/`): Wraps `oxc-parser` for JS/TS/JSX/TSX. Match by file extension, parse to OXC AST.
- **`Reporter`** (`src/reporters/`): Consumes `Report[]` after the run and formats output.

### Adding a New Rule

1. Create a `Collector` in `src/collectors/` (implement `createJSVisitor`, call `context.add({ key, location })`).
2. Export it from `src/collectors/collectors.ts` and `src/collectors/index.ts`.
3. Create a `Rule` in `src/rules/` using `Rule<[typeof myCollector]>` for typed `check` params.
4. Export it from `src/rules/index.ts`.
