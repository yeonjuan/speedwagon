import path from "node:path";
import { collectFiles } from "./collect-files.js";
import { parseArgs, generateHelp } from "./optionator.js";
import { logger } from "../logger.js";
import {
  runDuplicationsAnalyzers,
  analyzers,
} from "../analyzers/duplications/index.js";
import { jsLanguage } from "../languages/js.js";
import { tsLanguage } from "../languages/ts.js";
import { jsxLanguage } from "../languages/jsx.js";
import { tsxLanguage } from "../languages/tsx.js";
import type { Language } from "../languages/types.js";

const LANGUAGES: Language[] = [
  jsLanguage,
  tsLanguage,
  jsxLanguage,
  tsxLanguage,
];

const DEFAULT_PATTERNS = LANGUAGES.flatMap((lang) =>
  lang.extensions.map((ext) => `**/*${ext}`),
);

export class CLI {
  async run(argv: string[]): Promise<void> {
    const args = parseArgs(argv);

    if (args.help) {
      console.log(generateHelp());
      return;
    }

    if (args.debug) logger.enable();

    const cwd = process.cwd();
    const patterns =
      args.patterns.length > 0 ? args.patterns : DEFAULT_PATTERNS;
    const files = await collectFiles(patterns, {
      cwd,
      ignorePatterns: args.ignorePatterns,
    });

    const reports = await runDuplicationsAnalyzers(files, LANGUAGES, analyzers);

    if (reports.length === 0) {
      console.log("No duplications found.");
      return;
    }

    for (const report of reports) {
      console.log(report.message);
      for (const loc of report.locations) {
        const relPath = path.relative(cwd, loc.filePath);
        console.log(`  ${relPath}:${loc.line}:${loc.column}`);
      }
    }
  }
}
