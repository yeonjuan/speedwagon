import { collectors } from "../../collectors/index.js";
import type { Rule } from "../types.js";

export const duplicateThrow: Rule = {
  id: "duplicate-throw",
  collectors: [collectors.throwWithString],
  descriptions: {
    duplicated: "{{key}} is thrown {{count}} times",
  },
  suggestions: {
    duplicated: "Extract the error into a shared factory function or constant",
  },
  check(context, [throwWithString]) {
    for (const key of throwWithString.keys()) {
      const collections = throwWithString.getByKey(key);
      if (collections.length <= 1) {
        continue;
      }
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
