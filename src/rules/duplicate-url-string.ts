import { collectors } from "../collectors/index.js";
import type { Rule } from "./types.js";

export const duplicateUrlString: Rule = {
  id: "duplicate-url-string",
  collectors: [collectors.urlString],
  descriptions: {
    duplicated: "URL `{{url}}` is duplicated {{count}} times",
  },
  check(context, [urlString]) {
    for (const key of urlString.keys()) {
      const collections = urlString.getByKey(key);
      if (collections.length <= 1) {
        continue;
      }
      const displayName = collections[0].displayName;
      context.report({
        descriptionId: "duplicated",
        data: { url: displayName, count: collections.length },
        occurrences: collections.map(({ path, location }) => ({
          path,
          location,
        })),
      });
    }
  },
};
