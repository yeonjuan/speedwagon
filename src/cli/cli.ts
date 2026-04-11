import { parseArgs, generateHelp } from "./optionator.js";
import { collectFiles } from "./collect-files.js";
import { logger } from "../logger/index.js";
import { Runner } from "../runner/runner.js";
import {
  duplicateRegexLiteral,
  duplicateStringInterpolation,
  duplicateThrow,
  useDeclaredType,
  duplicateEnum,
} from "../rules/index.js";
import { StdoutReporter } from "../reporters/stdout-reporter.js";

export class CLI {
  async run(argv: string[]) {
    const { patterns, help, ignorePatterns } = parseArgs(argv);

    if (help || patterns.length === 0) {
      logger.info(generateHelp());
      return;
    }

    const files = await this.collect(patterns, ignorePatterns);
    if (files.length === 0) {
      return;
    }

    await this.analyze(files);
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

  private async analyze(files: string[]) {
    logger.info("Starting duplicate detection...\n");

    try {
      const runner = new Runner({
        paths: files,
        rules: [
          duplicateRegexLiteral,
          duplicateStringInterpolation,
          duplicateThrow,
          useDeclaredType,
          duplicateEnum,
        ],
        reporter: new StdoutReporter(),
      });
      await runner.run();
    } catch (error) {
      logger.error("Analysis failed:");
      console.error(error);
      process.exit(1);
    }
  }
}
