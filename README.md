# speedwagon

A CLI tool that statically analyzes JavaScript/TypeScript projects for structural code duplication, unused code, useless code, and browser-support gaps.

## The Problem

As a codebase grows, the same patterns tend to reappear — identical type definitions, duplicate enum declarations, repeated regex literals — while other code quietly rots: CSS classes nobody references anymore, sloppy formatting, APIs that don't actually work on the browsers you claim to support. These issues are hard to spot during code review and gradually make refactoring more expensive.

`speedwagon` surfaces all of this before it becomes technical debt.

## Installation

```bash
npm install -D speedwagon
```

## Usage

```bash
# Run in current directory (auto-detects all supported JS/TS files)
npx speedwagon

# Run only specific analyzer categories (all run when none is given)
npx speedwagon --duplication
npx speedwagon --unused
npx speedwagon --useless
npx speedwagon --browser-support

# Enable debug logging
npx speedwagon --debug
```

Files matched by `.gitignore` are automatically excluded.

## Supported File Types

- JS/TS: `.js`, `.mjs`, `.cjs`, `.ts`, `.mts`, `.cts`, `.jsx`, `.tsx`
- CSS: `.css`, `.scss` (CSS Modules `.module.css`/`.module.scss` for the Unused category)

## Duplications (`--duplication`)

Finds the same structure repeated across your codebase — within a file or across files.

| Rule                       | Description                                                                                   |
| -------------------------- | --------------------------------------------------------------------------------------------- |
| Duplicate RegExp literal   | Detects the same regular expression used across multiple files                                |
| Duplicate type declaration | Detects `type` aliases with identical structures (order-independent for unions/intersections) |
| Duplicate enum declaration | Detects `enum` declarations with identical members                                            |
| Duplicate JSX SVG          | Detects the same `<svg>` element used across multiple files                                   |
| Duplicate class names      | Detects duplicate CSS class names within a single `className`/`class` attribute               |
| Duplicate hardcoded URL    | Detects the same hardcoded `http(s)://` URL string literal used across multiple files         |

## Unused (`--unused`)

Finds code that's defined but never referenced.

| Rule             | Description                                                                                                                                             |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unused CSS class | Detects classes defined in a CSS Module (`.module.css`/`.module.scss`) that no JS/TS file imports and references via `styles.foo` / `styles['foo-bar']` |

## Useless (`--useless`)

Finds code that's harmless but pointless — noise that should be cleaned up.

| Rule                    | Description                                                                                |
| ----------------------- | ------------------------------------------------------------------------------------------ |
| Unnecessary class space | Detects leading/trailing or doubled whitespace inside a `className`/`class` string literal |

## Browser support (`--browser-support`)

Checks the JS/TS APIs and CSS features your code actually uses against your project's [browserslist](https://github.com/browserslist/browserslist) targets, using [`@mdn/browser-compat-data`](https://github.com/mdn/browser-compat-data).

- Reads targets from your `browserslist` config (`package.json` field, `.browserslistrc`, etc.), falling back to browserslist's defaults if none is found.
- Scans JS/TS for API usage — member access (`Array.prototype.at`), `new` expressions (`new IntersectionObserver()`), and global identifiers (`fetch`, `structuredClone`) — while ignoring locally-shadowed names and TypeScript type positions.
- Scans CSS/SCSS for properties, values, and at-rules (`display: grid`, `aspect-ratio`, `@container`).
- Reports every feature not supported by one or more of your target browsers, and prints the browser versions your code actually supports today.

```
Supported browsers:
  Chrome >= 92
  Internet Explorer not supported
  Safari >= 15.4

`.at (Array | String | TypedArray)` is not supported by target browsers (Chrome 60 -> 92, Internet Explorer 11 -> unsupported, Safari 11 -> 15.4)
  src/index.ts:2:12
```

## License

MIT
