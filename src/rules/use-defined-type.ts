import { collectors } from "../collectors/index.js";
import { RuleCategory } from "./types.js";
import type { Rule } from "./types.js";

export const useDefinedType: Rule = {
  id: "use-defined-type",
  category: RuleCategory.Duplication,
  collectors: [collectors.typeAliasDeclaration, collectors.typeAnnotation],
  descriptions: {
    useDefinedType:
      "Type `{{type}}` is already defined as `{{name}}`. Use `{{name}}` instead.",
  },
  check(context, [typeAliasDeclaration, typeAnnotation]) {
    for (const key of typeAnnotation.keys()) {
      const definitions = typeAliasDeclaration.getByKey(key);
      if (definitions.length === 0) {
        continue;
      }
      const usages = typeAnnotation.getByKey(key);
      const aliasName = definitions[0].displayName;
      const typeName = usages[0].displayName;
      context.report({
        descriptionId: "useDefinedType",
        data: { type: typeName, name: aliasName },
        occurrences: [
          ...definitions.map(({ path, location }) => ({ path, location })),
          ...usages.map(({ path, location }) => ({ path, location })),
        ],
      });
    }
  },
};
