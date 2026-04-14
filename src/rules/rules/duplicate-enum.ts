import { collectors } from "../../collectors/index.js";
import type { Rule } from "../types.js";

export const duplicateEnum: Rule = {
  id: "duplicate-enum",
  collectors: [collectors.enumDeclaration],
  descriptions: {
    duplicated: "Duplicate enum",
  },
  suggestions: {},
  check(context, [enumDeclaration]) {
    for (const key of enumDeclaration.keys()) {
      const collections = enumDeclaration.getByKey(key);
      if (collections.length >= 2) {
        collections.forEach(({ path, location }) => {
          context.report({
            descriptionId: "duplicated",
            path,
            location,
          });
        });
      }
    }
  },
};
