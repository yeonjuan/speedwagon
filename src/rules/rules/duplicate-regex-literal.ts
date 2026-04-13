import { collectors } from "../../collectors/index.js";
import type { Rule } from "../types.js";

export const duplicateRegexLiteral: Rule = {
  id: "duplicate-regex-literal",
  collectors: [collectors.regexLiteral],
  descriptions: {
    duplicated: "{{key}} is duplicated {{count}} times",
  },
  suggestions: {
    duplicated: "Remove duplicate regex literals and reuse a single variable",
  },
  check(context, [regexLiteral]) {
    for (const key of regexLiteral.keys()) {
      const collections = regexLiteral.getByKey(key);
      if (collections.length <= 1) {
        continue;
      }
      context.report({
        descriptionId: "duplicated",
        suggestionId: "duplicated",
        data: { key: collections[0].data.value, count: collections.length },
        occurrences: collections.map(({ path, location }) => ({
          path,
          location,
        })),
      });
    }
  },
};
