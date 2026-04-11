import { collectors } from "../../collectors/index.js";
import type { Rule } from "../types.js";

export const duplicateUrlString: Rule = {
  id: "duplicate-url-string",
  collectors: [collectors.urlString],
  descriptions: {
    duplicated: '"{{key}}" is duplicated {{count}} times',
  },
  suggestions: {
    duplicated: "Extract the URL into a shared constant and reuse it",
  },
  check(context, [urlString]) {
    for (const key of urlString.keys()) {
      const collections = urlString.getByKey(key);
      if (collections.length <= 1) continue;

      context.report({
        descriptionId: "duplicated",
        suggestionId: "duplicated",
        data: { key, count: collections.length },
        occurrences: collections.map(({ path, location }) => ({
          path,
          location,
        })),
      });
    }
  },
};
