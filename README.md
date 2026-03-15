# Code Duplicate Detection Tool

A scalable structural code duplicate detector using a memory-efficient Two-Phase Analysis approach.

## 📋 Overview

A CLI tool that parses JavaScript/TypeScript files using OXC parser, extracts metadata without keeping ASTs in memory, and identifies duplicates through pattern matching.

**Key Goal**: Handle large-scale projects without Out of Memory (OOM) issues by separating metadata collection from similarity analysis.

## 🚀 Quick Start

### Prerequisites

- Node.js >= 20.19.0 or >= 22.12.0
- pnpm >= 9.0.0

### Installation

```bash
# Install dependencies
pnpm install

# Build the project
pnpm build
```

### Usage

```bash
# Run the CLI
node dist/cli/bin.js 'src/**/*.ts'

# Or use the binary directly (after npm link)
dedupe 'src/**/*.ts'
```

## 📁 Project Structure

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

## 🔧 Development

### Build

```bash
# Build the project
pnpm build

# Watch mode
pnpm dev

# Clean build artifacts
pnpm clean
```

### Format

```bash
pnpm format
```

### Test

```bash
pnpm test
pnpm test:ui
pnpm test:coverage
```

## 🏗️ Architecture

### Two-Phase Analysis

This architecture is central to how the system works:

**Phase 1: Collection (Memory-Efficient)**

1. Parse files using OXC parser
2. Each detector's Collector visits AST nodes
3. Extract only essential metadata into GlobalContext
4. Immediately discard the AST - never keep ASTs in memory
5. Store metadata in namespaced Maps

**Phase 2: Analysis**

1. All detectors' Analyzers process collected metadata
2. Compare fingerprints across files to find duplicates
3. Generate Reports with similarity scores and locations

### Core Components

- **Runner**: Orchestrates both phases synchronously
- **GlobalContext**: Centralized metadata storage using nested Maps
- **Detector**: Pluggable modules implementing `createCollector()` and `analyze()`
- **Collector**: AST visitors that extract metadata during Phase 1
- **Reporter**: Output formatters (stdout, json, html)

## 📦 Built-in Detectors

### MagicNumberDetector

Finds duplicate literal values (numbers, strings, booleans, bigints)

- **Configuration**: `minOccurrences` (default: 3)
- **Skip Logic**: Ignores 0, 1, -1, small integers 2-10, and strings < 3 chars

## 📚 Documentation

See [CLAUDE.md](CLAUDE.md) for detailed architecture and implementation guide.

## 📝 License

ISC
