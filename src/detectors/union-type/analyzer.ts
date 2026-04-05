import type {
  DetectorContext,
  ReportContext,
  Report,
  DuplicateEntry,
} from "../../types/index.js";
import type { UnionTypeInfo, UnionTypeGroup } from "./types.js";

function groupUnionTypes(
  allUnionTypes: Map<string, UnionTypeInfo[]>,
  minOccurrences: number,
): UnionTypeGroup[] {
  const groups: UnionTypeGroup[] = [];

  for (const [, unionTypes] of allUnionTypes.entries()) {
    if (unionTypes.length < minOccurrences) {
      continue;
    }

    const first = unionTypes[0];
    groups.push({
      types: first.data.types,
      occurrences: unionTypes,
      count: unionTypes.length,
    });
  }

  return groups;
}

function createReport(group: UnionTypeGroup): Report {
  const duplicates: DuplicateEntry[] = group.occurrences.map((unionType) => {
    return {
      location: unionType.location,
      snippet: unionType.snippet,
      metadata: {
        types: unionType.data.types,
        raw: unionType.data.raw,
      },
    };
  });

  const typeStr = group.types.join(" | ");

  return {
    type: "union-type",
    similarity: 100,
    duplicates,
    description: `Union type "${typeStr}" appears ${group.count} times across the codebase`,
    suggestion: `Consider extracting this union type into a type alias (e.g., type MyType = ${typeStr})`,
  };
}

export function createAnalyzer(minOccurrences: number = 2) {
  return async (
    collectContext: DetectorContext,
    reportContext: ReportContext,
  ): Promise<void> => {
    const allUnionTypes = collectContext.getAllInfos<{
      types: string[];
      raw: string;
    }>();

    const groups = groupUnionTypes(allUnionTypes, minOccurrences);

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
