import type {
  DetectorContext,
  Report,
  ReportContext,
  DuplicateEntry,
} from "../../types/index.js";
import type {
  StringInterpolationInfo,
  StringInterpolationGroup,
} from "./types.js";
import type { StringInterpolationDetectorConfig } from "./collector.js";

function createReport(group: StringInterpolationGroup): Report {
  const duplicates: DuplicateEntry[] = group.occurrences.map((info) => {
    return {
      location: info.location,
      snippet: info.snippet,
    };
  });

  return {
    type: "string-interpolation",
    duplicates,
    description: `A structurally identical string interpolation format appears ${group.count} times across the codebase.`,
    suggestion: `Consider extracting this string interpolation pattern into a reusable format function or constant.\n  Format: \`${group.normalized}\``,
  };
}

export const createAnalyzer = (config: StringInterpolationDetectorConfig) => {
  return async (
    collectContext: DetectorContext,
    reportContext: ReportContext,
  ): Promise<void> => {
    const minOccurrences = config.minOccurrences ?? 2;

    const allExpressions =
      collectContext.getAllInfos<Record<string, unknown>>();

    const groups: StringInterpolationGroup[] = [];

    for (const [normalized, occurrences] of allExpressions.entries()) {
      if (occurrences.length >= minOccurrences) {
        groups.push({
          normalized,
          count: occurrences.length,
          occurrences,
        });
      }
    }

    // Sort by count descending
    groups.sort((a, b) => b.count - a.count);

    for (const group of groups) {
      reportContext.addReport(createReport(group));
    }
  };
};
