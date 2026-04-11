import type { Collector } from "../types.js";
import { getPosition, isStringLiteral } from "../ast-utils/index.js";

export const throwWithString: Collector = {
  id: "throw-with-string",
  createJSVisitor(context) {
    return {
      ThrowStatement(node) {
        const { argument } = node;
        if (argument.type !== "NewExpression") {
          return;
        }
        const { callee, arguments: args } = argument;
        if (callee.type !== "Identifier" || args.length === 0) {
          return;
        }
        const firstArg = args[0];
        if (!isStringLiteral(firstArg)) {
          return;
        }
        context.add({
          key: `${callee.name}:${firstArg.value}`,
          location: {
            start: getPosition(context.code, node.start),
            end: getPosition(context.code, node.end),
          },
        });
      },
    };
  },
};
