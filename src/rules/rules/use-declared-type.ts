import { collectors } from "../../collectors/index.js";
import type { Rule } from "../types.js";

export const useDeclaredType: Rule = {
  id: "use-declared-type",
  collectors: [collectors.typeAlias, collectors.inlineTypeUsage],
  descriptions: {
    duplicated: "{{normalizedType}} is already defined as {{typeName}}",
  },
  suggestions: {
    useExportedType:
      'Import and use the existing type: import type { {{typeName}} } from "..."',
    useLocalType: "Use the existing type: {{typeName}}",
  },
  check(context, [typeAlias, inlineTypeUsage]) {
    const definitionMap = new Map<
      string,
      { typeName: string; isExported: boolean }
    >();

    for (const key of typeAlias.keys()) {
      const [normalizedType, typeName, exportedFlag] = key.split("\x00");
      if (!definitionMap.has(normalizedType)) {
        definitionMap.set(normalizedType, {
          typeName,
          isExported: exportedFlag === "1",
        });
      }
    }

    for (const [normalizedType, { typeName, isExported }] of definitionMap) {
      const usages = inlineTypeUsage.getByKey(normalizedType);
      if (usages.length === 0) {
        continue;
      }
      context.report({
        descriptionId: "duplicated",
        suggestionId: isExported ? "useExportedType" : "useLocalType",
        data: { normalizedType, typeName },
        occurrences: usages.map(({ path, location }) => ({ path, location })),
      });
    }
  },
};
