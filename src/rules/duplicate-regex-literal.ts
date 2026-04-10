import { collectors } from "../collectors";
import type { Rule } from "./types";

export const duplicateRegexLiteral: Rule = {
  id: "duplicate-regex-literal",
  description: "TODO",
  collectors: [collectors.regexLiteral],
  check(context, [regexLiteral]) {
    for (const key of regexLiteral.keys()) {
      const collections = regexLiteral.getByKey(key);
      if (collections.length <= 1) {
        continue;
      }
      context
        .report
        // TODO
        ();
    }
  },
};
