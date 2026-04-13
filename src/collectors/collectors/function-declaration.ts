import type { Collector } from "../types.js";
import { getPosition } from "../ast-utils/index.js";
import { nodePrinter } from "../../node-printer/index.js";

function addFunction(
  context: Parameters<Collector["createJSVisitor"]>[0],
  node: { type: string; start: number; end: number },
) {
  const key = nodePrinter.functionNode(
    node as Parameters<typeof nodePrinter.functionNode>[0],
  );
  if (key === null) return;
  context.add({
    key,
    location: {
      start: getPosition(context.code, node.start),
      end: getPosition(context.code, node.end),
    },
  });
}

export const functionDeclaration: Collector = {
  id: "function-declaration",
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
