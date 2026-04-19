# project-dedupe

A CLI tool that detects code duplication in JS/TS files. Uses the OXC parser to analyze ASTs, discarding them immediately after traversal to keep only metadata in memory.

## Build & Run

```bash
pnpm build                            # build to dist/
node dist/main.js 'src/**/*.ts'       # or: npx speedwagon 'src/**/*.ts'       # run CLI
pnpm test                             # run tests
pnpm format                           # format code
```

## Architecture

Operates in two phases.

**Phase 1 – Collection**: Parse each file; Collectors traverse the AST and store only metadata into CollectorContext. The AST is discarded immediately.

**Phase 2 – Check**: Rules read CollectorContext to find duplicates and report to RuleContext.

```
Runner.run()
  ├── collectFromFile(path) × N  →  CollectorContext (key → Collection[])
  └── checkRule(rule)    × M  →  RuleContext (reports[])
       └── StdoutReporter.report()
```

## Directory Structure

```
src/
├── cli/           # CLI entry point, file collection, option parsing
├── collectors/    # AST visitors + CollectorContext
├── rules/         # Rule definitions, RuleContext
├── reporters/     # Output formatters (only StdoutReporter exists currently)
├── languages/     # Language-specific parser wrappers (js/ts/jsx/tsx)
├── logger/        # ANSI color logger (no chalk — raw ANSI codes)
└── types/         # Shared types
```

## Adding a New Rule

1. Add a Collector in `src/collectors/` (traverse AST → context.add())
2. Export it from `src/collectors/index.ts`
3. Implement the Rule in `src/rules/` (id, collectors, descriptions, check())
4. Export it from `src/rules/index.ts`
5. Register it in the rules array in `src/main.ts`

## Key Types

```ts
interface Collector {
  id: string;
  createJSVisitor(context: CollectorContextMutationAPI): VisitorObject;
}

interface Rule {
  id: string;
  collectors: Collector[];
  descriptions: Record<string, string>; // supports {{placeholder}} substitution
  check(context: RuleContext, collectorContexts: CollectorContext[]): void;
}
```

## Colored Output

`src/logger/index.ts` and `src/reporters/stdout-reporter.ts` use raw ANSI escape codes directly (no chalk). Colors are always applied regardless of TTY detection.
