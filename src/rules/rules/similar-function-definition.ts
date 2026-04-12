import { collectors } from "../../collectors/index.js";
import type { Rule } from "../types.js";

export const similarFunctionDefinition: Rule = {
  id: "similar-function-definition",
  collectors: [collectors.functionDeclaration],
  descriptions: {
    similar: "Similar function bodies found ({{count}} occurrences)",
  },
  suggestions: {
    similar: "Extract the duplicated logic into a shared function",
  },
  check(context, [functionDeclaration]) {
    for (const key of functionDeclaration.keys()) {
      const collections = functionDeclaration.getByKey(key);
      if (collections.length <= 1) continue;

      context.report({
        descriptionId: "similar",
        suggestionId: "similar",
        data: { count: collections.length },
        occurrences: collections.map(({ path, location }) => ({
          path,
          location,
        })),
      });
    }
  },
};
