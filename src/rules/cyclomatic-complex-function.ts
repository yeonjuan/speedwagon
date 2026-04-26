import { collectors } from "../collectors/index.js";
import { RuleCategory } from "./types.js";
import type { Rule } from "./types.js";

interface CyclomaticComplexOptions {
  threshold: number;
}

export const cyclomaticComplexFunction: Rule<
  [typeof collectors.cyclomaticComplexity],
  CyclomaticComplexOptions
> = {
  id: "cyclomatic-complex-function",
  category: RuleCategory.Complexity,
  collectors: [collectors.cyclomaticComplexity],
  defaultOptions: { threshold: 15 },
  descriptions: {
    complex:
      "{{name}} has a cyclomatic complexity of {{complexity}} (threshold: {{threshold}})",
  },
  check(context, [cyclomaticComplexity], options) {
    for (const key of cyclomaticComplexity.keys()) {
      for (const collection of cyclomaticComplexity.getByKey(key)) {
        context.report({
          descriptionId: "complex",
          data: {
            name: collection.displayName.replace(/ \(complexity: \d+\)$/, ""),
            complexity: key,
            threshold: options.threshold,
          },
          occurrences: [
            { path: collection.path, location: collection.location },
          ],
        });
      }
    }
  },
};
