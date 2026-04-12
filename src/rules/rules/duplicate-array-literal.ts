import { collectors } from "../../collectors/index.js";
import type { Rule } from "../types.js";

export const duplicateArrayLiteral: Rule = {
  id: "duplicate-array-literal",
  collectors: [collectors.arrayLiteral],
  descriptions: {
    duplicated: "{{key}} is duplicated {{count}} times",
  },
  suggestions: {
    duplicated: "Extract the array into a shared constant and reuse it",
  },
  check(context, [arrayLiteral]) {
    for (const key of arrayLiteral.keys()) {
      const collections = arrayLiteral.getByKey(key);
      if (collections.length <= 1) continue;

      context.report({
        descriptionId: "duplicated",
        suggestionId: "duplicated",
        data: { key: collections[0].name, count: collections.length },
        occurrences: collections.map(({ path, location }) => ({
          path,
          location,
        })),
      });
    }
  },
};
