# speedwagon

CLI tool that detects structural code duplication in JS/TS projects.

## Commands

```bash
pnpm build          # tsc (tsconfig.build.json)
pnpm test           # vitest --coverage
pnpm ts             # tsc --noEmit (type check)
pnpm format         # prettier --write .
pnpm format:check   # prettier --check .
pnpm knip           # unused code check
```

## Architecture

```
src/main.ts                         # entry: new CLI().run(process.argv)
src/cli/
  index.ts                          # CLI class, orchestrates everything
  collect-files.ts                  # fast-glob + gitignore filtering
  optionator.ts                     # arg parsing (--help, --debug)
src/languages/
  types.ts                          # Language interface: extensions, match(), parse()
  js.ts / ts.ts / jsx.ts / tsx.ts   # Language implementations using oxc-parser
  helpers.ts                        # createParseError
src/analyzers/duplications/
  types.ts                          # DuplicationsAnalyzer, CollectedItem, ReportItem, etc.
  runner.ts                         # AST walk → collect → analyze → report
  helpers.ts                        # analyzeCrossFileDuplicates()
  index.ts                          # barrel + analyzers array
  regex.ts                          # duplicate RegExp literals
  type-declaration.ts               # duplicate TSTypeAliasDeclaration (order-independent)
  enum-declaration.ts               # duplicate TSEnumDeclaration
  jsx-svg.ts                        # duplicate <svg> JSX elements
  class-name.ts                     # duplicate class names within a single attribute
  serialize-type.ts                 # TSType → canonical string
src/analyzers/useless/
  types.ts                          # UselessAnalyzer, ReportItem, VisitorContext
  runner.ts                         # AST walk → report (no collect phase)
  index.ts                          # barrel + analyzers array
  class-name-space.ts               # unnecessary whitespace in className/class attribute
src/test-utils/
  index.ts                          # runAnalyzer, runUselessAnalyzer test helpers
src/logger.ts                       # stderr debug logger (enabled via --debug)
```

## Analyzer Patterns

Two distinct patterns depending on analyzer category:

### duplications — collect-then-analyze

```ts
interface DuplicationsAnalyzer {
  visitor(context: VisitorContext): VisitorObject;
  analyze(context: AnalyzeContext): void;
}
// VisitorContext.collect() stores items; analyze() groups and reports cross-file duplicates
// ReportItem: { message: string; locations: { filePath, line, column }[] }
```

Flow: walk all files → collect items → analyze() groups by `languageId:::key` → report if 2+ files

- Cross-file duplicates only (same `languageId` required)
- `analyzeCrossFileDuplicates` helper handles the grouping logic
- `className` is the exception: within-attribute duplicate class detection, single file

### useless — report-on-visit

```ts
interface UselessAnalyzer {
  visitor(context: VisitorContext): VisitorObject;
}
// VisitorContext.report() emits immediately during AST walk (no collect phase)
// ReportItem: { message: string; location: { filePath, line, column } }
```

Flow: walk each file → report() called directly inside visitor

## Adding a New Analyzer

**duplications:** create `src/analyzers/duplications/<name>.ts`, implement `DuplicationsAnalyzer`, add to `src/analyzers/duplications/index.ts` analyzers array

**useless:** create `src/analyzers/useless/<name>.ts`, implement `UselessAnalyzer`, add to `src/analyzers/useless/index.ts` analyzers array

## Not Yet Implemented

- `speedwagon.json` config file exists in the repo but is not read by the CLI
- `--ignore`, `--report`, `--out` CLI options are typed in `optionator.ts` but not registered as actual options
- `runUselessAnalyzers` not yet wired into the CLI (`src/cli/index.ts`)
- `src/analyzers/unused/` — unused files analyzer (planned)
- Framework/library-specific rules (planned)
