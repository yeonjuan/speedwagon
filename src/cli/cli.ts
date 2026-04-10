import { parseArgs, generateHelp } from "./optionator.js";
import { collectFiles } from "./collect-files.js";
import { logger } from "../logger/index.js";

export class CLI {
  async run(argv: string[]) {
    const { patterns, help, ignorePatterns } = parseArgs(argv);

    if (help) {
      logger.info(generateHelp());
      return;
    }

    if (patterns.length === 0) {
      logger.warn(generateHelp());
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

    try {
      //   await runner.run();
    } catch (error) {
      logger.error("Analysis failed:");
      console.error(error);
      process.exit(1);
    }
  }
}
