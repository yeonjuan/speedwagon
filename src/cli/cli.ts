import {
  Runner,
  createUnionTypeDetector,
  createStringLiteralDetector,
} from "../index.js";
import { collectFiles } from "../utils/index.js";
import { logger } from "../logger/index.js";

export class CLI {
  async run(argv: string[]) {
    const patterns = argv.slice(2);

    if (patterns.length === 0) {
      logger.warn(
        "No patterns provided. Usage: dedupe <pattern> [<pattern>...]",
      );
      logger.info("Example: dedupe 'src/**/*.ts'");
      return;
    }

    logger.info("🔍 Collecting files...");
    const files = await collectFiles(patterns);

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
