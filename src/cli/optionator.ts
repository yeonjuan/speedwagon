import optionator from "optionator";

type ReportFormat = "stdout" | "json" | "html";

export const ANALYZER_CATEGORIES = [
  "duplication",
  "unused",
  "useless",
  "browser-support",
] as const;

export type AnalyzerCategory = (typeof ANALYZER_CATEGORIES)[number];

interface ParsedArgs {
  patterns: string[];
  help?: boolean;
  debug?: boolean;
  categories: AnalyzerCategory[];
  ignorePatterns: string[];
  report: ReportFormat;
  out?: string;
}

const parser = optionator({
  prepend: "Usage: speedwagon <pattern> [<pattern>...] [options]",
  options: [
    {
      option: "help",
      alias: "h",
      type: "Boolean",
      description: "Show help",
    },
    {
      option: "debug",
      type: "Boolean",
      description: "Enable debug logging",
    },
    {
      heading: "Analyzers (all run when none is specified)",
    },
    {
      option: "duplication",
      type: "Boolean",
      description: "Run duplication analyzers",
    },
    {
      option: "unused",
      type: "Boolean",
      description: "Run unused code analyzers",
    },
    {
      option: "useless",
      type: "Boolean",
      description: "Run useless code analyzers",
    },
    {
      option: "browser-support",
      type: "Boolean",
      description: "Run browser support analyzers",
    },
  ],
});

export function parseArgs(argv: string[]): ParsedArgs {
  const {
    _,
    ignore,
    report,
    out,
    duplication,
    unused,
    useless,
    browserSupport,
    ...rest
  } = parser.parse(argv) as {
    _: string[];
    help?: boolean;
    debug?: boolean;
    ignore?: string[];
    report?: string;
    out?: string;
    duplication?: boolean;
    unused?: boolean;
    useless?: boolean;
    browserSupport?: boolean;
  };

  const selected: AnalyzerCategory[] = [];
  if (duplication) selected.push("duplication");
  if (unused) selected.push("unused");
  if (useless) selected.push("useless");
  if (browserSupport) selected.push("browser-support");

  return {
    patterns: _,
    categories: selected.length > 0 ? selected : [...ANALYZER_CATEGORIES],
    ignorePatterns: ignore ?? [],
    report: (report ?? "stdout") as ReportFormat,
    out,
    ...rest,
  };
}

export function generateHelp(): string {
  return parser.generateHelp();
}
