import { collectors } from "../collectors/index.js";
import type { Rule } from "./types.js";

export const duplicateTypeDeclaration: Rule = {
  id: "duplicate-type-declaration",
  collectors: [collectors.typeAliasDeclaration],
  descriptions: {
    duplicated: "Type `{{type}}` is defined in {{count}} places",
  },
  check(context, [typeAliasDeclaration]) {
    for (const key of typeAliasDeclaration.keys()) {
      const collections = typeAliasDeclaration.getByKey(key);
      if (collections.length <= 1) {
        continue;
      }
      const displayName = collections[0].displayName;
      context.report({
        descriptionId: "duplicated",
        data: { type: displayName, count: collections.length },
        occurrences: collections.map(({ path, location }) => ({
          path,
          location,
        })),
      });
    }
  },
};
