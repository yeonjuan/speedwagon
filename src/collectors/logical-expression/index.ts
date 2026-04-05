import type {
  Collector,
  CollectorConfig,
  Report,
  CollectorContext,
} from "../../types/index.js";
import { logicalExpressionCollector } from "./collector.js";
import type { LogicalExpressionInfo } from "./types.js";

export interface LogicalExpressionCollectorConfig extends CollectorConfig {
  minOccurrences?: number;
  minOperands?: number;
}

export function createLogicalExpressionCollector(
  config: LogicalExpressionCollectorConfig = {},
): Collector {
  const minOccurrences = config.minOccurrences ?? 2;
  return {
    name: "logical-expression",
    description:
      "Detects structurally identical logical expressions to encourage extraction",
    createVisitor: logicalExpressionCollector(config),
    report: (context: CollectorContext): Report[] => {
      const reports: Report[] = [];
      const infos = context.getAllInfos<LogicalExpressionInfo>();
      for (const [normalized, duplicates] of infos.entries()) {
        if (duplicates.length >= minOccurrences) {
          reports.push({
            type: "logical-expression",
            description: `A structurally identical logical expression appears ${duplicates.length} times across the codebase`,
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
