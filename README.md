# speedwagon

A CLI tool that detects structural code duplication in JavaScript/TypeScript projects.

## The Problem

As a codebase grows, the same patterns tend to reappear — identical type definitions, duplicate enum declarations, repeated regex literals, and more. These duplicates are hard to spot during code review and gradually make refactoring more expensive.

`speedwagon` statically analyzes your JS/TS source files and surfaces these duplicates so you can consolidate them before they become technical debt.

## Installation

```bash
npm install -D speedwagon
```

## Usage

```bash
# Run in current directory (auto-detects all supported JS/TS files)
npx speedwagon

# Enable debug logging
npx speedwagon --debug
```

Files matched by `.gitignore` are automatically excluded.

## Supported File Types

`.js`, `.mjs`, `.cjs`, `.ts`, `.mts`, `.cts`, `.jsx`, `.tsx`

## Rules

| Rule                       | Description                                                                                   |
| -------------------------- | --------------------------------------------------------------------------------------------- |
| Duplicate RegExp literal   | Detects the same regular expression used across multiple files                                |
| Duplicate type declaration | Detects `type` aliases with identical structures (order-independent for unions/intersections) |
| Duplicate enum declaration | Detects `enum` declarations with identical members                                            |
| Duplicate JSX SVG          | Detects the same `<svg>` element used across multiple files                                   |
| Duplicate class names      | Detects duplicate CSS class names within a single `className`/`class` attribute               |

## License

MIT
