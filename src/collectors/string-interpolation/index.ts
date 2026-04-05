import type {
  Collector,
  CollectorConfig,
  Report,
  CollectorContext,
} from "../../types/index.js";
import { stringInterpolationCollector } from "./collector.js";
import type { StringInterpolationInfo } from "./types.js";

export interface StringInterpolationCollectorConfig extends CollectorConfig {
  minOccurrences?: number;
}

export function createStringInterpolationCollector(
  config: StringInterpolationCollectorConfig = {},
): Collector {
  const minOccurrences = config.minOccurrences ?? 2;
  return {
    name: "string-interpolation",
    description:
      "Detects structurally identical template literals to encourage deduplication",
    createVisitor: stringInterpolationCollector(config),
    report: (context: CollectorContext): Report[] => {
      const reports: Report[] = [];
      const infos = context.getAllInfos<StringInterpolationInfo>();
      for (const [normalized, duplicates] of infos.entries()) {
        if (duplicates.length >= minOccurrences) {
          reports.push({
            type: "string-interpolation",
            description: `Template string with schema "${normalized}" appears ${duplicates.length} times across the codebase. Parameter deduplication recommended.`,
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
