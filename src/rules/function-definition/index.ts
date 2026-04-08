import type {
  Rule,
  RuleConfig,
  RuleContext,
  Report,
} from "../../types/index.js";
import { functionDefinitionRule } from "./rule.js";
import type { FunctionDefinitionInfo } from "./types.js";

export interface FunctionDefinitionRuleConfig extends RuleConfig {
  minOccurrences?: number;
}

export function createFunctionDefinitionRule(
  config: FunctionDefinitionRuleConfig = {},
): Rule {
  const minOccurrences = config.minOccurrences ?? 2;

  return {
    name: "function-definition",
    description:
      "Detects structurally duplicated function definitions after AST normalization",
    createVisitor: functionDefinitionRule,
    report: (context: RuleContext): Report[] => {
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
