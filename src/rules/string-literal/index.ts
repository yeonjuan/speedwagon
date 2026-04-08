import type {
  Rule,
  RuleConfig,
  Report,
  RuleContext,
} from "../../types/index.js";
import { stringLiteralRule } from "./rule.js";
import type { StringLiteralInfo } from "./types.js";

export interface StringLiteralRuleConfig extends RuleConfig {
  minOccurrences?: number;
}

export function createStringLiteralRule(
  config: StringLiteralRuleConfig = {},
): Rule {
  const minOccurrences = config.minOccurrences ?? 3;
  return {
    name: "string-literal",
    description:
      "Finds duplicated hardcoded string literals to extract as constants",
    createVisitor: stringLiteralRule(config),
    report: (context: RuleContext): Report[] => {
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
