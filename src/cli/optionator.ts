import optionator from "optionator";

interface ParsedArgs {
  patterns: string[];
  help?: boolean;
  ignorePatterns: string[];
}

const parser = optionator({
  prepend: "Usage: dedupe <pattern> [<pattern>...] [options]",
  options: [
    {
      option: "help",
      alias: "h",
      type: "Boolean",
      description: "Show help",
    },
    {
      option: "ignore",
      type: "[String]",
      description: "Ignore pattern",
    },
  ],
});

export function parseArgs(argv: string[]): ParsedArgs {
  const { _, ignore, ...rest } = parser.parse(argv) as {
    _: string[];
    help?: boolean;
    ignore?: string[];
  };
  return { patterns: _, ignorePatterns: ignore ?? [], ...rest };
}

export function generateHelp(): string {
  return parser.generateHelp();
}
