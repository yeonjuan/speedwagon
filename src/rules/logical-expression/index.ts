import type {
  Rule,
  RuleConfig,
  Report,
  RuleContext,
} from "../../types/index.js";
import { logicalExpressionRule } from "./rule.js";
import type { LogicalExpressionInfo } from "./types.js";

export interface LogicalExpressionRuleConfig extends RuleConfig {
  minOccurrences?: number;
  minOperands?: number;
}

export function createLogicalExpressionRule(
  config: LogicalExpressionRuleConfig = {},
): Rule {
  const minOccurrences = config.minOccurrences ?? 2;
  return {
    name: "logical-expression",
    description:
      "Detects structurally identical logical expressions to encourage extraction",
    createVisitor: logicalExpressionRule(config),
    report: (context: RuleContext): Report[] => {
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
