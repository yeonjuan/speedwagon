import type {
  Rule,
  RuleConfig,
  Report,
  RuleContext,
} from "../../types/index.js";
import { stringInterpolationRule } from "./rule.js";
import type { StringInterpolationInfo } from "./types.js";

export interface StringInterpolationRuleConfig extends RuleConfig {
  minOccurrences?: number;
}

export function createStringInterpolationRule(
  config: StringInterpolationRuleConfig = {},
): Rule {
  const minOccurrences = config.minOccurrences ?? 2;
  return {
    name: "string-interpolation",
    description:
      "Detects structurally identical template literals to encourage deduplication",
    createVisitor: stringInterpolationRule(config),
    report: (context: RuleContext): Report[] => {
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
