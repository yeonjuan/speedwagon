import type {
  Collector,
  CollectorConfig,
  Report,
  CollectorContext,
} from "../../types/index.js";
import { unionTypeCollector } from "./collector.js";
import type { UnionTypeInfo } from "./types.js";

export interface UnionTypeCollectorConfig extends CollectorConfig {
  minOccurrences?: number;
}

export function createUnionTypeCollector(
  config: UnionTypeCollectorConfig = {},
): Collector {
  const minOccurrences = config.minOccurrences ?? 2;
  return {
    name: "union-type",
    description: "Detects identical union types to encourage type extraction",
    createVisitor: unionTypeCollector,
    report: (context: CollectorContext): Report[] => {
      const reports: Report[] = [];
      const infos = context.getAllInfos<UnionTypeInfo>();
      for (const [normalized, duplicates] of infos.entries()) {
        if (duplicates.length >= minOccurrences) {
          reports.push({
            type: "union-type",
            description: `Union type ${normalized} appears ${duplicates.length} times across the codebase. Extract as a shared type alias.`,
            suggestion: `Extract ${normalized} to a type alias and share it.`,
            duplicates: duplicates.map((d) => ({
              location: d.location,
              snippet: d.snippet,
              metadata: d.data as Record<string, any>,
            })),
          });
        }
      }
      return reports;
    },
  };
}
