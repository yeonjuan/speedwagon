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
  optionator.ts                     # arg parsing (--help, --debug, --duplication, --unused, --useless, --browser-support)
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
src/analyzers/browser-support/
  types.ts                          # FoundFeature, Conflict, BrowserTarget, etc.
  resolver.ts                       # browserslist targets → BCD browser names + min versions
  version.ts                        # version string compare/normalize helpers
  js-scanner.ts                     # oxc-walker two-pass scan → member/new/identifier features
  css-scanner.ts                    # postcss scan → css-property/css-value/css-at-rule features
  bcd-mapper.ts                     # features + targets → Conflict[] via @mdn/browser-compat-data
  runner.ts                         # orchestrates resolver → scanners → mapper → report items
  index.ts                          # barrel (runBrowserSupportAnalyzer)
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
// VisitorContext.collect() stores items; analyze() groups and reports duplicates (same file or across files)
// ReportItem: { message: string; locations: { filePath, line, column }[] }
```

Flow: walk all files → collect items → analyze() groups by `languageId:::key` → report if 2+ occurrences

- Same-file and cross-file duplicates both reported (same `languageId` required)
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

### browser-support — whole-project analysis

Not a per-file visitor analyzer like the two above. `runBrowserSupportAnalyzer(filePaths, languages, cwd)`:
resolve browserslist targets once (`resolver.ts`) → scan every JS/TS file (`js-scanner.ts`, oxc-walker with a
`ScopeTracker` two-pass so locally-shadowed globals aren't false positives) and every `.css`/`.scss` file
(`css-scanner.ts`, postcss) into `FoundFeature[]` → match all features against the resolved targets in one pass
(`bcd-mapper.ts`, using `@mdn/browser-compat-data`) → map `Conflict[]` to `{ message, locations }` report items.
CSS files are collected via `**/*.css`/`**/*.scss` (not the `.module.css` `CssLanguage`s, which are unused-CSS-class-only).

## Adding a New Analyzer

**duplications:** create `src/analyzers/duplications/<name>.ts`, implement `DuplicationsAnalyzer`, add to `src/analyzers/duplications/index.ts` analyzers array

**useless:** create `src/analyzers/useless/<name>.ts`, implement `UselessAnalyzer`, add to `src/analyzers/useless/index.ts` analyzers array

## Not Yet Implemented

- `speedwagon.json` config file exists in the repo but is not read by the CLI
- `--ignore`, `--report`, `--out` CLI options are typed in `optionator.ts` but not registered as actual options
- `src/analyzers/unused/` — unused files analyzer (planned; currently only unused CSS module classes)
- Framework/library-specific rules (planned)
