import type { Collector } from "../types.js";
import { getPosition, isStringLiteral } from "../ast-utils/index.js";

const URL_PATTERN = /^https?:\/\/.+/;

export const urlString: Collector = {
  id: "url-string",
  createJSVisitor(context) {
    return {
      Literal(node) {
        if (!isStringLiteral(node)) return;
        if (!URL_PATTERN.test(node.value)) return;
        context.add({
          key: node.value,
          location: {
            start: getPosition(context.code, node.start),
            end: getPosition(context.code, node.end),
          },
        });
      },
    };
  },
};
