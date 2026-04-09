import type { RegexLiteralInfo } from "./types.js";
import { formatId } from "../../utils/index.js";
import { getPosition, createRule, extractSnippet } from "../../utils/index.js";
import { AST_TYPES } from "../../constants/index.js";

export interface RegexLiteralRuleConfig {
  minOccurrences?: number;
}

export const regexLiteralRule = (config: RegexLiteralRuleConfig) =>
  createRule((context, filePath, sourceCode) => {
    let counter = 0;

    return {
      [AST_TYPES.Literal]: (node) => {
        const regexNode = node as any;
        if (regexNode.regex) {
          const pattern = regexNode.regex.pattern;
          const flags = regexNode.regex.flags;

          const raw = `/${pattern}/${flags}`;

          const loc = {
            file: filePath,
            start: getPosition(sourceCode, node.start),
            end: getPosition(sourceCode, node.end),
          };
          const snippet = extractSnippet(sourceCode, loc);

          context.addInfo(raw, formatId(filePath, counter++), loc, snippet, {
            pattern,
            flags,
            raw,
          });
        }
      },
    };
  });
