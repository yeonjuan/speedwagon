import { collectors } from "../collectors/index.js";
import type { Rule } from "./types.js";

export const duplicateRegexLiteral: Rule = {
  id: "duplicate-regex-literal",
  category: "duplication",
  collectors: [collectors.regexLiteral],
  descriptions: {
    duplicated: "RegExp `{{regexp}}` is duplicated {{count}} times",
  },
  check(context, [regexLiteral]) {
    for (const key of regexLiteral.keys()) {
      const collections = regexLiteral.getByKey(key);
      if (collections.length <= 1) {
        continue;
      }
      const displayName = collections[0].displayName;
      context.report({
        descriptionId: "duplicated",
        data: { regexp: displayName, count: collections.length },
        occurrences: collections.map(({ path, location }) => ({
          path,
          location,
        })),
      });
    }
  },
};
