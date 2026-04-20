import { collectors } from "../collectors/index.js";
import type { Rule } from "./types.js";

export const cyclomaticComplexFunction: Rule = {
  id: "cyclomatic-complex-function",
  collectors: [collectors.cyclomaticComplexity],
  descriptions: {
    complex:
      "{{name}} has a cyclomatic complexity of {{complexity}} (threshold: {{threshold}})",
  },
  check(context, [cyclomaticComplexity]) {
    for (const key of cyclomaticComplexity.keys()) {
      for (const collection of cyclomaticComplexity.getByKey(key)) {
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
