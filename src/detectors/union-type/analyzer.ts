import type {
  GlobalContext,
  Report,
  DuplicateEntry,
} from "../../types/index.js";
import type { UnionTypeInfo, UnionTypeGroup } from "./types.js";
import { readFileSync } from "fs";

export class UnionTypeAnalyzer {
  private readonly namespace = "union-type";
  private readonly minOccurrences: number;

  constructor(minOccurrences: number = 2) {
    this.minOccurrences = minOccurrences;
  }

  async analyze(context: GlobalContext): Promise<Report[]> {
    const reports: Report[] = [];

    const allUnionTypes = context.getAll<UnionTypeInfo[]>(this.namespace);

    const groups = this.groupUnionTypes(allUnionTypes);

    for (const group of groups) {
      if (group.count >= this.minOccurrences) {
        const report = this.createReport(group);
        reports.push(report);
      }
    }

    reports.sort((a, b) => b.duplicates.length - a.duplicates.length);

    return reports;
  }

  private groupUnionTypes(
    allUnionTypes: Map<string, UnionTypeInfo[]>,
  ): UnionTypeGroup[] {
    const groups: UnionTypeGroup[] = [];

    for (const [key, unionTypes] of allUnionTypes.entries()) {
      if (unionTypes.length < this.minOccurrences) {
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

  private createReport(group: UnionTypeGroup): Report {
    const duplicates: DuplicateEntry[] = group.occurrences.map((unionType) => {
      const snippet = this.extractSnippet(unionType);

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

  private extractSnippet(unionType: UnionTypeInfo): string {
    try {
      const content = readFileSync(unionType.location.file, "utf-8");
      const lines = content.split("\n");
      const lineIndex = unionType.location.start.line - 1;

      const startLine = Math.max(0, lineIndex - 1);
      const endLine = Math.min(lines.length, lineIndex + 2);

      return lines.slice(startLine, endLine).join("\n").trim();
    } catch (error) {
      return `// Unable to extract snippet: ${error}`;
    }
  }
}
