import optionator from "optionator";

export type ReportFormat = "stdout" | "json" | "html";

interface ParsedArgs {
  patterns: string[];
  help?: boolean;
  ignorePatterns: string[];
  report: ReportFormat;
  out?: string;
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
    {
      option: "report",
      type: "String",
      default: "stdout",
      description: "Report format: stdout, json, html",
    },
    {
      option: "out",
      type: "String",
      description:
        "Output file path for json/html report (default: report.json or report.html)",
    },
  ],
});

export function parseArgs(argv: string[]): ParsedArgs {
  const { _, ignore, report, out, ...rest } = parser.parse(argv) as {
    _: string[];
    help?: boolean;
    ignore?: string[];
    report?: string;
    out?: string;
  };
  return {
    patterns: _,
    ignorePatterns: ignore ?? [],
    report: (report ?? "stdout") as ReportFormat,
    out,
    ...rest,
  };
}

export function generateHelp(): string {
  return parser.generateHelp();
}
