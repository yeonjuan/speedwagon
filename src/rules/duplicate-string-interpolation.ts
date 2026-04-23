import { collectors } from "../collectors/index.js";
import type { Rule } from "./types.js";

export const duplicateStringInterpolation: Rule = {
  id: "duplicate-string-interpolation",
  category: "duplication",
  collectors: [collectors.stringInterpolation],
  descriptions: {
    duplicated: "`{{template}}` is used in {{count}} places",
  },
  check(context, [stringInterpolation]) {
    for (const key of stringInterpolation.keys()) {
      const collections = stringInterpolation.getByKey(key);
      if (collections.length <= 1) {
        continue;
      }
      const displayName = collections[0].displayName;
      context.report({
        descriptionId: "duplicated",
        data: { template: displayName, count: collections.length },
        occurrences: collections.map(({ path, location }) => ({
          path,
          location,
        })),
      });
    }
  },
};
