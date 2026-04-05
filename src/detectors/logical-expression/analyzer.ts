import type {
  DetectorContext,
  ReportContext,
  Report,
  DuplicateEntry,
} from "../../types/index.js";
import type { LogicalExpressionInfo, LogicalExpressionGroup } from "./types.js";
import { readFileSync } from "fs";
import { ENCODING_UTF8 } from "../../constants.js";

function groupExpressions(
  allExpressions: Map<string, LogicalExpressionInfo[]>,
  minOccurrences: number,
): LogicalExpressionGroup[] {
  const groups: LogicalExpressionGroup[] = [];

  for (const [normalized, occurrences] of allExpressions.entries()) {
    if (occurrences.length < minOccurrences) {
      continue;
    }

    groups.push({
      normalized,
      occurrences,
      count: occurrences.length,
    });
  }

  return groups;
}

function extractSnippet(info: LogicalExpressionInfo): string {
  try {
    const content = readFileSync(info.location.file, ENCODING_UTF8);
    const lines = content.split("\n");
    const lineIndex = info.location.start.line - 1;

    const startLine = Math.max(0, lineIndex - 1);
    const endLine = Math.min(lines.length, lineIndex + 5); // show a bit more context for multi-line logic

    return lines.slice(startLine, endLine).join("\n").trim();
  } catch (error) {
    return `// Unable to extract snippet: ${error}`;
  }
}

function createReport(group: LogicalExpressionGroup): Report {
  const duplicates: DuplicateEntry[] = group.occurrences.map((info) => {
    return {
      location: info.location,
      snippet: extractSnippet(info),
    };
  });

  return {
    type: "logical-expression",
    similarity: 100, // They match exactly after structural parameterization
    duplicates,
    description: `A structurally identical logical expression appears ${group.count} times across the codebase`,
    suggestion: `Consider extracting this logical expression into a separate helper function.`,
  };
}

export interface LogicalExpressionAnalyzerConfig {
  minOccurrences?: number;
}

export function createAnalyzer(config: LogicalExpressionAnalyzerConfig) {
  const minOccurrences = config.minOccurrences ?? 2;
  return async (
    collectContext: DetectorContext,
    reportContext: ReportContext,
  ): Promise<void> => {
    const allExpressions = collectContext.getAll<LogicalExpressionInfo[]>();

    const groups = groupExpressions(allExpressions, minOccurrences);

    const reports: Report[] = [];
    for (const group of groups) {
      if (group.count >= minOccurrences) {
        reports.push(createReport(group));
      }
    }

    reports.sort((a, b) => b.duplicates.length - a.duplicates.length);

    for (const report of reports) {
      reportContext.addReport(report);
    }
  };
}
