import type { Collector } from "../types.js";
import { getPosition, isStringLiteral } from "../ast-utils/index.js";
import { nodeNormalizer } from "../../node-normalizer/index.js";

const URL_PATTERN = /^https?:\/\/.+/;

export const urlString: Collector = {
  id: "url-string",
  createJSVisitor(context) {
    return {
      Literal(node) {
        if (!isStringLiteral(node)) return;
        if (!URL_PATTERN.test(node.value)) return;
        const key = nodeNormalizer.stringLiteral(node);
        context.add({
          key,
          name: node.value,
          location: {
            start: getPosition(context.code, node.start),
            end: getPosition(context.code, node.end),
          },
        });
      },
    };
  },
};
