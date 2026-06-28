import { walk } from "oxc-walker";
import fs from "node:fs/promises";
import { logger } from "../../logger.js";
import type { Language } from "../../languages/types.js";
import type {
  DuplicationsAnalyzer,
  CollectedItem,
  ReportItem,
  VisitorContext,
} from "./types.js";

function getLineColumn(
  source: string,
  offset: number,
): { line: number; column: number } {
  let line = 1;
  let column = 0;
  for (let i = 0; i < offset && i < source.length; i++) {
    if (source[i] === "\n") {
      line++;
      column = 0;
    } else {
      column++;
    }
  }
  return { line, column };
}

export async function runDuplicationsAnalyzers(
  filePaths: string[],
  languages: Language[],
  analyzers: DuplicationsAnalyzer[],
): Promise<ReportItem[]> {
  const itemsByAnalyzer: CollectedItem[][] = analyzers.map(() => []);

  logger.debug(`Analyzing ${filePaths.length} files`);

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

    const visitorObjects = analyzers.map((analyzer, i) => {
      const context: VisitorContext = {
        filePath,
        languageId: language.extensions[0],
        collect({ key, display, offset }) {
          const { line, column } = getLineColumn(sourceCode, offset);
          itemsByAnalyzer[i].push({
            key,
            display,
            filePath,
            languageId: language.extensions[0],
            line,
            column,
          });
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

  const totalItems = itemsByAnalyzer.reduce(
    (sum, items) => sum + items.length,
    0,
  );
  logger.debug(`Collected ${totalItems} items total`);

  const reports: ReportItem[] = [];

  for (let i = 0; i < analyzers.length; i++) {
    analyzers[i].analyze({
      items: itemsByAnalyzer[i],
      report(item) {
        reports.push(item);
      },
    });
  }

  return reports;
}
