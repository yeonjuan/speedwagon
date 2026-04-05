import {
  Runner,
  createUnionTypeDetector,
  createStringLiteralDetector,
  createLogicalExpressionDetector,
  createStringInterpolationDetector,
} from "../index.js";
import { collectFiles } from "../utils/index.js";
import { logger } from "../logger/index.js";

export class CLI {
  async run(argv: string[]) {
    const args = argv.slice(2);
    const ignorePatterns: string[] = [];
    const patterns: string[] = [];

    for (let i = 0; i < args.length; i++) {
      if (args[i] === "--ignore" && i + 1 < args.length) {
        ignorePatterns.push(args[i + 1]);
        i++;
      } else if (!args[i].startsWith("--")) {
        patterns.push(args[i]);
      }
    }

    if (patterns.length === 0) {
      logger.warn(
        "No patterns provided. Usage: dedupe <pattern> [<pattern>...] [--ignore <pattern>]",
      );
      logger.info("Example: dedupe 'src/**/*.ts' --ignore '**/*.spec.ts'");
      return;
    }

    logger.info("🔍 Collecting files...");
    const files = await collectFiles(patterns, { ignorePatterns });

    if (files.length === 0) {
      logger.info("No files found");
      return;
    }

    logger.success(`Found ${files.length} file(s)`);
    logger.divider();

    logger.info("Starting duplicate detection...\n");

    const runner = new Runner({
      files,
      detectors: [
        createUnionTypeDetector({ minOccurrences: 2 }),
        createStringLiteralDetector({ minOccurrences: 3 }),
        createLogicalExpressionDetector({ minOccurrences: 2, minOperands: 2 }),
        createStringInterpolationDetector({ minOccurrences: 2 }),
      ],
      verbose: false,
    });

    try {
      await runner.run();
    } catch (error) {
      logger.error("Analysis failed:");
      console.error(error);
      process.exit(1);
    }
  }
}
