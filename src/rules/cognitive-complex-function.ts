import { collectors } from "../collectors/index.js";
import { RuleCategory } from "./types.js";
import type { Rule } from "./types.js";

interface CognitiveComplexOptions {
  threshold: number;
}

export const cognitiveComplexFunction: Rule<
  [typeof collectors.cognitiveComplexity],
  CognitiveComplexOptions
> = {
  id: "cognitive-complex-function",
  category: RuleCategory.Complexity,
  collectors: [collectors.cognitiveComplexity],
  defaultOptions: { threshold: 15 },
  descriptions: {
    complex:
      "{{name}} has a cognitive complexity of {{complexity}} (threshold: {{threshold}})",
  },
  check(context, [cognitiveComplexity], options) {
    for (const key of cognitiveComplexity.keys()) {
      for (const collection of cognitiveComplexity.getByKey(key)) {
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
