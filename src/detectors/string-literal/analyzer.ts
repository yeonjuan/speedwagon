import type {
  DetectorContext,
  ReportContext,
  Report,
  DuplicateEntry,
} from "../../types/index.js";
import type { StringLiteralInfo } from "./types.js";

interface StringLiteralGroup {
  value: string;
  count: number;
  occurrences: StringLiteralInfo[];
}

function groupStringLiterals(
  allLiterals: Map<string, StringLiteralInfo[]>,
  minOccurrences: number,
): StringLiteralGroup[] {
  const groups: StringLiteralGroup[] = [];

  for (const [value, occurrences] of allLiterals) {
    if (occurrences.length >= minOccurrences) {
      groups.push({
        value,
        count: occurrences.length,
        occurrences,
      });
    }
  }

  return groups;
}

function createReport(group: StringLiteralGroup): Report {
  const duplicates: DuplicateEntry[] = group.occurrences.map((info) => ({
    location: info.location,
    snippet: `"${info.value}"`,
    metadata: {
      value: info.value,
      context: info.context,
    },
  }));

  return {
    type: "string-literal",
    similarity: 100,
    duplicates,
    description: `String literal "${group.value}" appears ${group.count} times across the codebase`,
    suggestion: `Consider extracting this string literal into a named constant (e.g., const MY_CONSTANT = "${group.value}")`,
  };
}

export function createAnalyzer(minOccurrences: number = 3) {
  return async (
    collectContext: DetectorContext,
    reportContext: ReportContext,
  ): Promise<void> => {
    const allLiterals = collectContext.getAll<StringLiteralInfo[]>();
    const groups = groupStringLiterals(allLiterals, minOccurrences);

    const reports: Report[] = [];
    for (const group of groups) {
      if (group.count >= minOccurrences) {
        const report = createReport(group);
        reports.push(report);
      }
    }

    reports.sort((a, b) => b.duplicates.length - a.duplicates.length);

    for (const report of reports) {
      reportContext.addReport(report);
    }
  };
}
