import { writeFile } from "fs/promises";
import { parseArgs, generateHelp, type ReportFormat } from "./optionator.js";
import { collectFiles } from "./collect-files.js";
import { logger } from "../logger/index.js";
import { Runner } from "./runner.js";
import {
  duplicateRegexLiteral,
  duplicateUrlString,
  duplicateTypeDeclaration,
  duplicateEnumDeclaration,
  useDefinedType,
  cognitiveComplexFunction,
  cyclomaticComplexFunction,
} from "../rules/index.js";

const DEFAULT_OUT: Record<Exclude<ReportFormat, "stdout">, string> = {
  json: "report.json",
  html: "report.html",
};

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
      const runner = new Runner({
        paths: files,
        format,
        rules: [
          duplicateRegexLiteral,
          duplicateUrlString,
          duplicateTypeDeclaration,
          duplicateEnumDeclaration,
          useDefinedType,
          cognitiveComplexFunction,
          cyclomaticComplexFunction,
        ],
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
