import { collectors } from "../collectors/index.js";
import type { Rule } from "./types.js";

export const cognitiveComplexFunction: Rule = {
  id: "cognitive-complex-function",
  category: "complexity",
  collectors: [collectors.cognitiveComplexity],
  descriptions: {
    complex:
      "{{name}} has a cognitive complexity of {{complexity}} (threshold: {{threshold}})",
  },
  check(context, [cognitiveComplexity]) {
    for (const key of cognitiveComplexity.keys()) {
      for (const collection of cognitiveComplexity.getByKey(key)) {
        context.report({
          descriptionId: "complex",
          data: {
            name: collection.displayName.replace(/ \(complexity: \d+\)$/, ""),
            complexity: key,
            threshold: 15,
          },
          occurrences: [
            { path: collection.path, location: collection.location },
          ],
        });
      }
    }
  },
};
