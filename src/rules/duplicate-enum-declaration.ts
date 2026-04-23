import { collectors } from "../collectors/index.js";
import type { Rule } from "./types.js";

export const duplicateEnumDeclaration: Rule = {
  id: "duplicate-enum-declaration",
  category: "duplication",
  collectors: [collectors.enumDeclaration],
  descriptions: {
    duplicated: "Enum `{{enum}}` is defined in {{count}} places",
  },
  check(context, [enumDeclaration]) {
    for (const key of enumDeclaration.keys()) {
      const collections = enumDeclaration.getByKey(key);
      if (collections.length <= 1) {
        continue;
      }
      const displayName = collections[0].displayName;
      context.report({
        descriptionId: "duplicated",
        data: { enum: displayName, count: collections.length },
        occurrences: collections.map(({ path, location }) => ({
          path,
          location,
        })),
      });
    }
  },
};
