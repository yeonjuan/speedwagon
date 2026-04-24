import { collectors } from "../collectors/index.js";
import { RuleCategory } from "./types.js";
import type { Rule } from "./types.js";

export const duplicateFunction: Rule = {
  id: "duplicate-function",
  category: RuleCategory.Duplication,
  collectors: [collectors.functionBody],
  descriptions: {
    duplicated: "Function `{{name}}` is duplicated {{count}} times",
  },
  check(context, [functionBody]) {
    for (const key of functionBody.keys()) {
      const collections = functionBody.getByKey(key);
      if (collections.length <= 1) continue;
      const displayName = collections[0].displayName;
      context.report({
        descriptionId: "duplicated",
        data: { name: displayName, count: collections.length },
        occurrences: collections.map(({ path, location }) => ({
          path,
          location,
        })),
      });
    }
  },
};
