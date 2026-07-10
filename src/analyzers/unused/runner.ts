import fs from "node:fs/promises";
import { logger } from "../../logger.js";
import type { Language } from "../../languages/types.js";
import type { CssLanguage } from "../../languages/types.js";
import type {
  UnusedAnalyzer,
  ReportItem,
  DefinedClass,
  UsedClass,
} from "./types.js";

export async function runUnusedAnalyzers(
  filePaths: string[],
  languages: Language[],
  cssLanguages: CssLanguage[],
  analyzers: UnusedAnalyzer[],
): Promise<ReportItem[]> {
  const definedByAnalyzer: DefinedClass[][] = analyzers.map(() => []);
  const usedByAnalyzer: UsedClass[][] = analyzers.map(() => []);

  for (const filePath of filePaths) {
    const cssLanguage = cssLanguages.find((lang) => lang.match(filePath));

    if (cssLanguage) {
      let content: string;
      try {
        content = await fs.readFile(filePath, "utf-8");
      } catch {
        logger.debug(`Failed to read ${filePath}`);
        continue;
      }

      const root = cssLanguage.parse(content);
      for (let i = 0; i < analyzers.length; i++) {
        if (
          analyzers[i].cssModuleExtensions.some((ext) => filePath.endsWith(ext))
        ) {
          definedByAnalyzer[i].push(
            ...analyzers[i].extractClasses(filePath, root),
          );
        }
      }
      continue;
    }

    const jsLanguage = languages.find((lang) => lang.match(filePath));
    if (!jsLanguage) continue;

    logger.debug(`Processing ${filePath}`);

    let sourceCode: string;
    try {
      sourceCode = await fs.readFile(filePath, "utf-8");
    } catch {
      logger.debug(`Failed to read ${filePath}`);
      continue;
    }

    let program;
    try {
      program = await jsLanguage.parse(sourceCode, filePath);
    } catch {
      logger.debug(`Failed to parse ${filePath}`);
      continue;
    }

    for (let i = 0; i < analyzers.length; i++) {
      usedByAnalyzer[i].push(...analyzers[i].collectUsages(filePath, program));
    }
  }

  const reports: ReportItem[] = [];
  for (let i = 0; i < analyzers.length; i++) {
    analyzers[i].analyze({
      definedClasses: definedByAnalyzer[i],
      usedClasses: usedByAnalyzer[i],
      report: (item) => reports.push(item),
    });
  }

  return reports;
}
