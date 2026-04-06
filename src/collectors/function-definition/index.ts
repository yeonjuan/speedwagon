import type {
  Collector,
  CollectorConfig,
  CollectorContext,
  Report,
} from "../../types/index.js";
import { functionDefinitionCollector } from "./collector.js";
import type { FunctionDefinitionInfo } from "./types.js";

export interface FunctionDefinitionCollectorConfig extends CollectorConfig {
  minOccurrences?: number;
}

export function createFunctionDefinitionCollector(
  config: FunctionDefinitionCollectorConfig = {},
): Collector {
  const minOccurrences = config.minOccurrences ?? 2;

  return {
    name: "function-definition",
    description:
      "Detects structurally duplicated function definitions after AST normalization",
    createVisitor: functionDefinitionCollector,
    report: (context: CollectorContext): Report[] => {
      const reports: Report[] = [];
      const infos = context.getAllInfos<FunctionDefinitionInfo>();

      for (const [normalized, duplicates] of infos.entries()) {
        if (duplicates.length < minOccurrences) {
          continue;
        }

        reports.push({
          type: "function-definition",
          description: `Function definition with normalized AST ${normalized} appears ${duplicates.length} times across the codebase.`,
          suggestion:
            "Extract the shared logic into a reusable helper function or common abstraction.",
          duplicates: duplicates.map((duplicate) => ({
            location: duplicate.location,
            snippet: duplicate.snippet,
            metadata: duplicate.data as Record<string, any>,
          })),
        });
      }

      return reports.sort(
        (left, right) => right.duplicates.length - left.duplicates.length,
      );
    },
  };
}
