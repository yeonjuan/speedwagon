# speedwagon

A CLI tool that detects structural code duplication in JavaScript/TypeScript projects.

## The Problem

As a codebase grows, the same patterns tend to reappear — identical type definitions, duplicate enum declarations, repeated URL strings, and more. These duplicates are hard to spot during code review and gradually make refactoring more expensive.

`speedwagon` statically analyzes your JS/TS source files and surfaces these duplicates so you can consolidate them before they become technical debt.

## Installation

```bash
npm install -D speedwagon
```

## Usage

```bash
# Run in current directory (auto-detects all supported JS/TS files)
npx speedwagon

# Ignore certain paths
npx speedwagon --ignore 'src/**/*.spec.ts'
```

## Rules

| Rule                              | Description                                                           |
| --------------------------------- | --------------------------------------------------------------------- |
| `duplicate-type-declaration`      | Detects `type` aliases with identical structures                      |
| `duplicate-interface-declaration` | Detects `interface` declarations with identical structures            |
| `duplicate-enum-declaration`      | Detects `enum` declarations with identical members                    |
| `duplicate-url-string`            | Detects repeated URL string literals                                  |
| `duplicate-regex-literal`         | Detects repeated regular expression literals                          |
| `duplicate-string-interpolation`  | Detects repeated template literal patterns                            |
| `use-defined-type`                | Detects inline type annotations that duplicate an existing named type |
| `cognitive-complex-function`      | Detects functions with a cognitive complexity above 15                |
| `cyclomatic-complex-function`     | Detects functions with a cyclomatic complexity above 15               |

## Requirements

- Node.js >= 20.19.0 or >= 22.12.0

## License

MIT
