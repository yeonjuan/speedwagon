import type {
  Collector,
  CollectorConfig,
  Report,
  CollectorContext,
} from "../../types/index.js";
import { stringLiteralCollector } from "./collector.js";
import type { StringLiteralInfo } from "./types.js";

export interface StringLiteralCollectorConfig extends CollectorConfig {
  minOccurrences?: number;
}

export function createStringLiteralCollector(
  config: StringLiteralCollectorConfig = {},
): Collector {
  const minOccurrences = config.minOccurrences ?? 3;
  return {
    name: "string-literal",
    description:
      "Finds duplicated hardcoded string literals to extract as constants",
    createVisitor: stringLiteralCollector(config),
    report: (context: CollectorContext): Report[] => {
      const reports: Report[] = [];
      const infos = context.getAllInfos<StringLiteralInfo>();
      for (const [normalized, duplicates] of infos.entries()) {
        if (duplicates.length >= minOccurrences) {
          reports.push({
            type: "string-literal",
            description: `String literal "${normalized}" appears ${duplicates.length} times across the codebase. Extract to a constant mapping.`,
            suggestion: `Extract "${normalized}" to a named constant and reuse it.`,
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
