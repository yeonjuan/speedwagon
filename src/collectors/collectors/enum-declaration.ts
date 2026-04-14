import type { Collector } from "../types.js";
import { getPosition } from "../ast-utils/index.js";
import { nodeNormalizer } from "../../node-normalizer/index.js";
import { nodePrinter } from "../../node-printer/index.js";
import type { TSEnumDeclaration } from "oxc-parser";
import { extractCode } from "../../utils/extractCode.js";

function normalizeTsEnumDeclaration(node: TSEnumDeclaration, code: string) {
  return node.body.members
    .map((member) => {
      const key = extractCode(member.id, code);
      const intializer = member.initializer
        ? extractCode(member.initializer, code)
        : null;
      return `[${[key, intializer].filter(Boolean).join()}]`;
    })
    .sort()
    .join();
}

export const enumDeclaration: Collector<{ name: string }> = {
  id: "enum-declaration",
  createJSVisitor(context) {
    return {
      TSEnumDeclaration(node) {
        const key = normalizeTsEnumDeclaration(node, context.code);
        context.add({
          key,
          data: { name: node.id.name },
          location: {
            start: getPosition(context.code, node.start),
            end: getPosition(context.code, node.end),
          },
        });
      },
    };
  },
};
