import { collectors } from "../../collectors/index.js";
import type { Rule } from "../types.js";

export const similarFunctionDefinition: Rule = {
  id: "similar-function-definition",
  collectors: [collectors.functionBody],
  descriptions: {
    similar: "Similar function bodies found ({{count}} occurrences)",
  },
  suggestions: {
    similar: "Extract the duplicated logic into a shared function",
  },
  check(context, [functionBody]) {
    for (const key of functionBody.keys()) {
      const collections = functionBody.getByKey(key);
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
