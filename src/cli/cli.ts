import { collectFiles } from "./helpers/index.js";
import { logger } from "../logger/index.js";

export class CLI {
  async run(argv: string[]) {
    const patterns = argv.slice(2);

    if (patterns.length === 0) {
      logger.warn("No patterns provided");
      return;
    }

    const files = await collectFiles(patterns);

    if (files.length === 0) {
      logger.info("No files found");
      return;
    }

    logger.success(`Found ${files.length} file(s)`);
    logger.divider();
    logger.list(files);
  }
}
