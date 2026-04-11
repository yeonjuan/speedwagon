import { collectors } from "../../collectors/index.js";
import { KEY_SEP } from "../../collectors/ast-utils/index.js";
import type { Rule } from "../types.js";

export const duplicateEnum: Rule = {
  id: "duplicate-enum",
  collectors: [collectors.enumDeclaration],
  descriptions: {
    duplicated: "{{enumName}} has the same members as {{existingName}}",
  },
  suggestions: {
    useExported:
      'Import and use the existing enum: import { {{existingName}} } from "..."',
    useLocal: "Use the existing enum: {{existingName}}",
  },
  check(context, [enumDeclaration]) {
    const seen = new Map<string, { enumName: string; isExported: boolean }>();

    for (const key of enumDeclaration.keys()) {
      const [membersKey, enumName, exportedFlag] = key.split(KEY_SEP);
      const isExported = exportedFlag === "1";

      if (!seen.has(membersKey)) {
        seen.set(membersKey, { enumName, isExported });
        continue;
      }

      const existing = seen.get(membersKey)!;
      const collections = enumDeclaration.getByKey(key);

      context.report({
        descriptionId: "duplicated",
        suggestionId: existing.isExported ? "useExported" : "useLocal",
        data: { enumName, existingName: existing.enumName },
        occurrences: collections.map(({ path, location }) => ({
          path,
          location,
        })),
      });
    }
  },
};
