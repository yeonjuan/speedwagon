import { collectors } from "../../collectors/index.js";
import type { Rule } from "../types.js";

export const duplicateStringInterpolation: Rule = {
  id: "duplicate-string-interpolation",
  collectors: [collectors.templateInterpolation],
  descriptions: {
    duplicated: '"{{key}}" is duplicated {{count}} times',
  },
  suggestions: {
    duplicated:
      "Extract the duplicated template into a reusable function or constant",
  },
  check(context, [templateInterpolation]) {
    for (const key of templateInterpolation.keys()) {
      const collections = templateInterpolation.getByKey(key);
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
