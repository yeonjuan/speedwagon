import type {
  Rule,
  RuleConfig,
  Report,
  RuleContext,
} from "../../types/index.js";
import { regexLiteralRule } from "./rule.js";
import type { RegexLiteralInfo } from "./types.js";

export interface RegexLiteralRuleConfig extends RuleConfig {
  minOccurrences?: number;
}

export function createRegexLiteralRule(
  config: RegexLiteralRuleConfig = {},
): Rule {
  const minOccurrences = config.minOccurrences ?? 2;
  return {
    name: "regex-literal",
    description:
      "Finds duplicated regular expressions to extract as shared constants",
    createVisitor: regexLiteralRule(config),
    report: (context: RuleContext): Report[] => {
      const reports: Report[] = [];
      const infos = context.getAllInfos<RegexLiteralInfo>();
      for (const [normalized, duplicates] of infos.entries()) {
        if (duplicates.length >= minOccurrences) {
          reports.push({
            type: "regex-literal",
            description: `Regular expression ${normalized} appears ${duplicates.length} times across the codebase. Extract to a constant.`,
            suggestion: `Extract ${normalized} to a named constant and reuse it.`,
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
