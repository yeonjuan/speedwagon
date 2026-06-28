import { walk } from "oxc-walker";
import type { Language } from "../languages/types.js";
import type {
  CollectedItem,
  DuplicationsAnalyzer,
  ReportItem,
} from "../analyzers/duplications/types.js";
import type {
  UselessAnalyzer,
  ReportItem as UselessReportItem,
} from "../analyzers/useless/types.js";

export interface FileInput {
  filePath: string;
  code: string;
  language: Language;
  scope?: string;
}

export async function runAnalyzer(
  analyzer: DuplicationsAnalyzer,
  files: FileInput[],
): Promise<ReportItem[]> {
  const items: CollectedItem[] = [];
  for (const { filePath, code, language, scope = "" } of files) {
    const program = await language.parse(code, filePath);
    const ctx = {
      filePath,
      languageId: language.extensions[0],
      scope,
      collect({
        key,
        display,
        offset,
      }: {
        key: string;
        display: string;
        offset: number;
      }) {
        const lines = code.slice(0, offset).split("\n");
        items.push({
          key,
          display,
          filePath,
          languageId: language.extensions[0],
          scope,
          line: lines.length,
          column: lines[lines.length - 1].length,
        });
      },
    };
    const visitorObj = analyzer.visitor(ctx);
    walk(program, {
      enter(node) {
        const fn = (visitorObj as Record<string, unknown>)[node.type];
        if (typeof fn === "function") (fn as (n: unknown) => void)(node);
      },
    });
  }
  const reports: ReportItem[] = [];
  analyzer.analyze({ items, report: (item) => reports.push(item) });
  return reports;
}

export async function runUselessAnalyzer(
  analyzer: UselessAnalyzer,
  files: FileInput[],
): Promise<UselessReportItem[]> {
  const reports: UselessReportItem[] = [];
  for (const { filePath, code, language } of files) {
    const program = await language.parse(code, filePath);
    const ctx = {
      filePath,
      languageId: language.extensions[0],
      report({ message, offset }: { message: string; offset: number }) {
        const lines = code.slice(0, offset).split("\n");
        reports.push({
          message,
          location: {
            filePath,
            line: lines.length,
            column: lines[lines.length - 1].length,
          },
        });
      },
    };
    const visitorObj = analyzer.visitor(ctx);
    walk(program, {
      enter(node) {
        const fn = (visitorObj as Record<string, unknown>)[node.type];
        if (typeof fn === "function") (fn as (n: unknown) => void)(node);
      },
    });
  }
  return reports;
}
