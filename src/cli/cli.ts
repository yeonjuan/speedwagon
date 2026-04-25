import { writeFile } from "fs/promises";
import { parseArgs, generateHelp, type ReportFormat } from "./optionator.js";
import { collectFiles } from "./collect-files.js";
import { loadConfig } from "./load-config.js";
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
  duplicateInterfaceDeclaration,
  duplicateStringInterpolation,
  duplicateFunction,
  duplicateMagicNumbers,
} from "../rules/index.js";
import {
  jsLanguage,
  tsLanguage,
  jsxLanguage,
  tsxLanguage,
} from "../languages/index.js";

const DEFAULT_OUT: Record<Exclude<ReportFormat, "stdout">, string> = {
  json: "report.json",
  html: "report.html",
};

const SUPPORTED_LANGUAGES = [jsLanguage, tsLanguage, jsxLanguage, tsxLanguage];

function buildDefaultPatterns(): string[] {
  const extensions = SUPPORTED_LANGUAGES.flatMap((lang) => lang.extensions);
  return [`**/*.{${extensions.map((ext) => ext.slice(1)).join(",")}}`];
}

export class CLI {
  async run(argv: string[]) {
    const { patterns, help, ignorePatterns, report, out } = parseArgs(argv);

    if (help) {
      logger.info(generateHelp());
      return;
    }

    const config = await loadConfig();
    const resolvedIgnorePatterns = [
      ...ignorePatterns,
      ...(config.ignores ?? []),
    ];

    const resolvedPatterns =
      patterns.length > 0 ? patterns : buildDefaultPatterns();
    const files = await this.collect(resolvedPatterns, resolvedIgnorePatterns);
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
        rules: [
          duplicateRegexLiteral,
          duplicateUrlString,
          duplicateTypeDeclaration,
          duplicateEnumDeclaration,
          duplicateInterfaceDeclaration,
          duplicateStringInterpolation,
          useDefinedType,
          cognitiveComplexFunction,
          cyclomaticComplexFunction,
          duplicateFunction,
          duplicateMagicNumbers,
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
