import { walk } from "oxc-walker";
import fs from "node:fs/promises";
import { logger } from "../../logger.js";
import type { Language } from "../../languages/types.js";
import type { UselessAnalyzer, ReportItem, VisitorContext } from "./types.js";

function getLineColumn(
  source: string,
  offset: number,
): { line: number; column: number } {
  const lines = source.slice(0, offset).split("\n");
  return { line: lines.length, column: lines[lines.length - 1].length };
}

export async function runUselessAnalyzers(
  filePaths: string[],
  languages: Language[],
  analyzers: UselessAnalyzer[],
): Promise<ReportItem[]> {
  const reports: ReportItem[] = [];

  for (const filePath of filePaths) {
    const language = languages.find((lang) => lang.match(filePath));
    if (!language) continue;

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
      program = await language.parse(sourceCode, filePath);
    } catch {
      logger.debug(`Failed to parse ${filePath}`);
      continue;
    }

    const visitorObjects = analyzers.map((analyzer) => {
      const context: VisitorContext = {
        filePath,
        languageId: language.extensions[0],
        report({ message, offset }) {
          const { line, column } = getLineColumn(sourceCode, offset);
          reports.push({ message, location: { filePath, line, column } });
        },
      };
      return analyzer.visitor(context);
    });

    walk(program, {
      enter(node) {
        for (const visitorObj of visitorObjects) {
          const handler = (visitorObj as Record<string, unknown>)[node.type];
          if (typeof handler === "function") {
            (handler as (n: unknown) => void)(node);
          }
        }
      },
    });
  }

  return reports;
}
