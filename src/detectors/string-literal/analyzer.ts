import type {
  DetectorContext,
  ReportContext,
  Report,
  DuplicateEntry,
} from "../../types/index.js";
import type { StringLiteralInfo, StringLiteralGroup } from "./types.js";
import type { StringLiteralDetectorConfig } from "./collector.js";

function createReport(group: StringLiteralGroup): Report {
  const duplicates: DuplicateEntry[] = group.occurrences.map((info) => {
    return {
      location: info.location,
      snippet: info.snippet,
      metadata: {
        value: info.data.value,
        context: info.data.context,
      },
    };
  });

  return {
    type: "string-literal",
    duplicates,
    description: `String literal "${group.value}" appears ${group.count} times across the codebase.`,
    suggestion: `Consider extracting "${group.value}" into a named constant.`,
  };
}

export function createAnalyzer(config: StringLiteralDetectorConfig) {
  const minOccurrences = config.minOccurrences ?? 3;
  return async (
    collectContext: DetectorContext,
    reportContext: ReportContext,
  ): Promise<void> => {
    const allStringLiterals = collectContext.getAllInfos<{
      value: string;
      context: string;
    }>();

    const groups: StringLiteralGroup[] = [];
    for (const [key, occurrences] of allStringLiterals.entries()) {
      if (occurrences.length >= minOccurrences) {
        groups.push({
          value: key,
          occurrences:
            occurrences as ReadonlyArray<StringLiteralInfo> as StringLiteralInfo[],
          count: occurrences.length,
        });
      }
    }

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
