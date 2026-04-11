import { writeFile } from "fs/promises";
import { parseArgs, generateHelp, type ReportFormat } from "./optionator.js";
import { collectFiles } from "./collect-files.js";
import { logger } from "../logger/index.js";
import { Runner } from "../runner/runner.js";
import {
  duplicateRegexLiteral,
  duplicateStringInterpolation,
  duplicateThrow,
  useDeclaredType,
  duplicateEnum,
  similarFunctionDefinition,
} from "../rules/index.js";
import { StdoutReporter } from "../reporters/stdout-reporter.js";
import { JsonReporter } from "../reporters/json-reporter.js";
import { HtmlReporter } from "../reporters/html-reporter.js";
import type { Reporter } from "../reporters/types.js";

const DEFAULT_OUT: Record<Exclude<ReportFormat, "stdout">, string> = {
  json: "report.json",
  html: "report.html",
};

function createReporter(format: ReportFormat): Reporter {
  switch (format) {
    case "json":
      return new JsonReporter();
    case "html":
      return new HtmlReporter();
    default:
      return new StdoutReporter();
  }
}

export class CLI {
  async run(argv: string[]) {
    const { patterns, help, ignorePatterns, report, out } = parseArgs(argv);

    if (help || patterns.length === 0) {
      logger.info(generateHelp());
      return;
    }

    const files = await this.collect(patterns, ignorePatterns);
    if (files.length === 0) {
      return;
    }

    await this.analyze(files, report, out);
  }

  private async collect(
    patterns: string[],
    ignorePatterns: string[],
  ): Promise<string[]> {
    logger.info("🔍 Collecting files...");
    const files = await collectFiles(patterns, { ignorePatterns });

    if (files.length === 0) {
      logger.info("No files found");
      return [];
    }

    logger.success(`Found ${files.length} file(s)`);
    logger.divider();
    return files;
  }

  private async analyze(
    files: string[],
    format: ReportFormat,
    out: string | undefined,
  ) {
    logger.info("Starting duplicate detection...\n");

    try {
      const reporter = createReporter(format);
      const runner = new Runner({
        paths: files,
        rules: [
          duplicateRegexLiteral,
          duplicateStringInterpolation,
          duplicateThrow,
          useDeclaredType,
          duplicateEnum,
          similarFunctionDefinition,
        ],
        reporter,
      });
      const output = await runner.run();

      if (typeof output === "string") {
        const outPath =
          out ?? DEFAULT_OUT[format as Exclude<ReportFormat, "stdout">];
        await writeFile(outPath, output, "utf-8");
        logger.success(`Report written to ${outPath}`);
      }
    } catch (error) {
      logger.error("Analysis failed:");
      console.error(error);
      process.exit(1);
    }
  }
}
