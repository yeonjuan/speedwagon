import { collectFiles } from "./helpers/index.js";

export class CLI {
  async run(argv: string[]) {
    const patterns = argv.slice(2);

    if (patterns.length === 0) {
      console.log("No patterns provided");
      return;
    }

    const files = await collectFiles(patterns);

    console.log(`Found ${files.length} file(s):`);
    files.forEach((file) => {
      console.log(file);
    });
  }
}
