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

function isNewLine(code: number): boolean {
  return code === 10 || code === 13 || code === 0x2028 || code === 0x2029;
}

function nextLineBreak(source: string, from: number, end: number): number {
  for (let i = from; i < end; i++) {
    const next = source.charCodeAt(i);
    if (isNewLine(next)) {
      return i < end - 1 && next === 13 && source.charCodeAt(i + 1) === 10
        ? i + 2
        : i + 1;
    }
  }
  return -1;
}

function getLineColumn(
  source: string,
  offset: number,
): { line: number; column: number } {
  for (let line = 1, cur = 0; ; ) {
    const nextBreak = nextLineBreak(source, cur, offset);
    if (nextBreak < 0) return { line, column: offset - cur };
    line++;
    cur = nextBreak;
  }
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
