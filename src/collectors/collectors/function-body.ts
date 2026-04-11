import type { Collector } from "../types.js";
import { getPosition, normalizeAst } from "../ast-utils/index.js";

function addFunction(
  context: Parameters<Collector["createJSVisitor"]>[0],
  node: { type: string; start: number; end: number },
) {
  const key = normalizeAst(node as Parameters<typeof normalizeAst>[0]);
  if (key === null) return;
  context.add({
    key,
    location: {
      start: getPosition(context.code, node.start),
      end: getPosition(context.code, node.end),
    },
  });
}

export const functionBody: Collector = {
  id: "function-body",
  createJSVisitor(context) {
    return {
      FunctionDeclaration(node) {
        addFunction(context, node);
      },
      FunctionExpression(node) {
        addFunction(context, node);
      },
      ArrowFunctionExpression(node) {
        addFunction(context, node);
      },
    };
  },
};
