import type {
  Function as FunctionNode,
  ArrowFunctionExpression,
  SwitchCase,
  LogicalExpression,
} from "oxc-parser";
import type { Collector } from "./types.js";
import { getPosition } from "./ast-utils/index.js";

type AnyFunctionNode = FunctionNode | ArrowFunctionExpression;

interface FunctionFrame {
  complexity: number;
  name: string;
  node: AnyFunctionNode;
}

const threshold = 15;

export const cyclomaticComplexity: Collector = {
  id: "cyclomatic-complexity",
  createJSVisitor(context) {
    const frameStack: FunctionFrame[] = [];

    function currentFrame() {
      return frameStack[frameStack.length - 1];
    }

    function increment() {
      const frame = currentFrame();
      if (frame) frame.complexity += 1;
    }

    function getFunctionName(node: AnyFunctionNode): string {
      if (node.id) return node.id.name;
      return "<anonymous>";
    }

    function onEnterFunction(node: AnyFunctionNode) {
      frameStack.push({ complexity: 1, name: getFunctionName(node), node });
    }

    function onExitFunction() {
      const frame = frameStack.pop();
      if (!frame || frame.complexity <= threshold) return;
      context.add({
        key: String(frame.complexity),
        displayName: `${frame.name} (complexity: ${frame.complexity})`,
        location: {
          start: getPosition(context.code, frame.node.start),
          end: getPosition(context.code, frame.node.end),
        },
      });
    }

    return {
      FunctionDeclaration: onEnterFunction,
      "FunctionDeclaration:exit": onExitFunction,
      FunctionExpression: onEnterFunction,
      "FunctionExpression:exit": onExitFunction,
      ArrowFunctionExpression: onEnterFunction,
      "ArrowFunctionExpression:exit": onExitFunction,

      IfStatement() {
        if (currentFrame()) increment();
      },

      ForStatement() {
        if (currentFrame()) increment();
      },

      ForInStatement() {
        if (currentFrame()) increment();
      },

      ForOfStatement() {
        if (currentFrame()) increment();
      },

      WhileStatement() {
        if (currentFrame()) increment();
      },

      DoWhileStatement() {
        if (currentFrame()) increment();
      },

      SwitchCase(node: SwitchCase) {
        if (currentFrame() && node.test !== null) increment();
      },

      CatchClause() {
        if (currentFrame()) increment();
      },

      ConditionalExpression() {
        if (currentFrame()) increment();
      },

      LogicalExpression(node: LogicalExpression) {
        if (currentFrame()) increment();
      },
    };
  },
};
