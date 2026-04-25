import { collectors } from "../collectors/index.js";
import { RuleCategory } from "./types.js";
import type { Rule } from "./types.js";

const IGNORED_NUMBERS = new Set(["-1", "0", "1"]);

export const duplicateMagicNumbers: Rule = {
  id: "duplicate-magic-numbers",
  category: RuleCategory.Duplication,
  collectors: [collectors.magicNumber],
  descriptions: {
    duplicated: "Magic number `{{number}}` is duplicated {{count}} times",
  },
  check(context, [magicNumber]) {
    for (const key of magicNumber.keys()) {
      if (IGNORED_NUMBERS.has(key)) {
        continue;
      }
      const collections = magicNumber.getByKey(key);
      if (collections.length <= 1) {
        continue;
      }
      const displayName = collections[0].displayName;
      context.report({
        descriptionId: "duplicated",
        data: { number: displayName, count: collections.length },
        occurrences: collections.map(({ path, location }) => ({
          path,
          location,
        })),
      });
    }
  },
};
