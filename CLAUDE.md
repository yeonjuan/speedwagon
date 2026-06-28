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
src/logger.ts                       # stderr debug logger (enabled via --debug)
```

## Key Types

```ts
interface DuplicationsAnalyzer {
  visitor(context: VisitorContext): VisitorObject; // oxc-walker visitor
  analyze(context: AnalyzeContext): void;
}

interface VisitorContext {
  filePath: string;
  languageId: string; // first extension of the matched language e.g. ".ts"
  collect(item: { key: string; display: string; offset: number }): void;
}

interface CollectedItem {
  key: string;
  display: string;
  filePath: string;
  languageId: string;
  line: number;
  column: number;
}

interface ReportItem {
  message: string;
  locations: { filePath: string; line: number; column: number }[];
}
```

## Runner Flow

1. Match each file to a language → parse with oxc-parser
2. Walk AST with oxc-walker → call each analyzer's `visitor()` → collect items via `collect()`
3. After all files processed → call each analyzer's `analyze()` → report duplicates via `report()`
4. CLI prints results to stdout

## Duplication Rules

- Cross-file duplicates only (same `languageId` required)
- `analyzeCrossFileDuplicates`: groups by `languageId:::key`, reports if 2+ files contain the same key
- `className` is the exception: detects duplicate class names within a single attribute in one file

## Adding a New Analyzer

1. Create `src/analyzers/duplications/<name>.ts`, implement `DuplicationsAnalyzer`
2. Add to the `analyzers` array in `src/analyzers/duplications/index.ts`

## Not Yet Implemented

- `speedwagon.json` config file exists in the repo but is not read by the CLI
- `--ignore`, `--report`, `--out` CLI options are typed in `optionator.ts` but not registered as actual options
- `src/analyzers/unused/` — unused files analyzer (planned)
- Framework/library-specific rules (planned)
