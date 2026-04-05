import type {
  DetectorContext,
  ReportContext,
  Report,
  DuplicateEntry,
} from "../../types/index.js";
import type { UnionTypeInfo, UnionTypeGroup } from "./types.js";
import { readFileSync } from "fs";
import { ENCODING_UTF8 } from "../../constants.js";

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
      types: first.types,
      occurrences: unionTypes,
      count: unionTypes.length,
    });
  }

  return groups;
}

function extractSnippet(unionType: UnionTypeInfo): string {
  try {
    const content = readFileSync(unionType.location.file, ENCODING_UTF8);
    const lines = content.split("\n");
    const lineIndex = unionType.location.start.line - 1;

    const startLine = Math.max(0, lineIndex - 1);
    const endLine = Math.min(lines.length, lineIndex + 2);

    return lines.slice(startLine, endLine).join("\n").trim();
  } catch (error) {
    return `// Unable to extract snippet: ${error}`;
  }
}

function createReport(group: UnionTypeGroup): Report {
  const duplicates: DuplicateEntry[] = group.occurrences.map((unionType) => {
    const snippet = extractSnippet(unionType);

    return {
      location: unionType.location,
      snippet,
      metadata: {
        types: unionType.types,
        raw: unionType.raw,
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
    const allUnionTypes = collectContext.getAll<UnionTypeInfo[]>();

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
