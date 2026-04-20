import type {
  Function as FunctionNode,
  ArrowFunctionExpression,
  IfStatement,
  LogicalExpression,
} from "oxc-parser";
import type { Collector } from "./types.js";
import { getPosition } from "./ast-utils/index.js";

type AnyFunctionNode = FunctionNode | ArrowFunctionExpression;

interface FunctionFrame {
  complexity: number;
  localNesting: number;
  name: string;
  node: AnyFunctionNode;
}

const threshold = 15;

export const cognitiveComplexity: Collector = {
  id: `cognitive-complexity`,
  createJSVisitor(context) {
    const frameStack: FunctionFrame[] = [];
    const elseIfNodes = new WeakSet<object>();
    const coveredLogicalNodes = new WeakSet<object>();

    function currentFrame(): FunctionFrame | undefined {
      return frameStack[frameStack.length - 1];
    }

    function effectiveNesting(): number {
      return currentFrame()?.localNesting ?? 0;
    }

    function addWithNesting() {
      const frame = currentFrame();
      if (!frame) return;
      frame.complexity += 1 + effectiveNesting();
      frame.localNesting++;
    }

    function decrementNesting() {
      const frame = currentFrame();
      if (frame) frame.localNesting--;
    }

    function addFlat() {
      const frame = currentFrame();
      if (frame) frame.complexity += 1;
    }

    function getFunctionName(node: AnyFunctionNode): string {
      if (node.id) return node.id.name;
      return "<anonymous>";
    }

    function onEnterFunction(node: AnyFunctionNode) {
      frameStack.push({
        complexity: 0,
        localNesting: 0,
        name: getFunctionName(node),
        node,
      });
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

    function flattenLogicalExpression(
      node: LogicalExpression,
    ): LogicalExpression[] {
      coveredLogicalNodes.add(node);
      const result: LogicalExpression[] = [];
      if (node.left.type === "LogicalExpression") {
        result.push(
          ...flattenLogicalExpression(node.left as LogicalExpression),
        );
      }
      result.push(node);
      if (node.right.type === "LogicalExpression") {
        result.push(
          ...flattenLogicalExpression(node.right as LogicalExpression),
        );
      }
      return result;
    }

    return {
      FunctionDeclaration: onEnterFunction,
      "FunctionDeclaration:exit": onExitFunction,
      FunctionExpression: onEnterFunction,
      "FunctionExpression:exit": onExitFunction,
      ArrowFunctionExpression: onEnterFunction,
      "ArrowFunctionExpression:exit": onExitFunction,

      IfStatement(node: IfStatement) {
        if (!currentFrame()) return;

        if (node.alternate?.type === "IfStatement") {
          elseIfNodes.add(node.alternate);
        }

        if (elseIfNodes.has(node)) {
          // else-if: +1 flat (no nesting bonus, no extra nesting increment)
          addFlat();
        } else {
          // Regular if: +1 + nesting, increases nesting for body
          addWithNesting();
        }

        // else branch (non-else-if): +1 flat
        if (node.alternate && node.alternate.type !== "IfStatement") {
          addFlat();
        }
      },

      "IfStatement:exit"(node: IfStatement) {
        if (!currentFrame()) return;
        // Only decrement nesting for regular ifs, not else-if
        if (!elseIfNodes.has(node)) {
          decrementNesting();
        }
      },

      ForStatement() {
        if (currentFrame()) addWithNesting();
      },
      "ForStatement:exit"() {
        if (currentFrame()) decrementNesting();
      },

      ForInStatement() {
        if (currentFrame()) addWithNesting();
      },
      "ForInStatement:exit"() {
        if (currentFrame()) decrementNesting();
      },

      ForOfStatement() {
        if (currentFrame()) addWithNesting();
      },
      "ForOfStatement:exit"() {
        if (currentFrame()) decrementNesting();
      },

      WhileStatement() {
        if (currentFrame()) addWithNesting();
      },
      "WhileStatement:exit"() {
        if (currentFrame()) decrementNesting();
      },

      DoWhileStatement() {
        if (currentFrame()) addWithNesting();
      },
      "DoWhileStatement:exit"() {
        if (currentFrame()) decrementNesting();
      },

      SwitchStatement() {
        if (currentFrame()) addWithNesting();
      },
      "SwitchStatement:exit"() {
        if (currentFrame()) decrementNesting();
      },

      CatchClause() {
        if (currentFrame()) addWithNesting();
      },
      "CatchClause:exit"() {
        if (currentFrame()) decrementNesting();
      },

      ConditionalExpression() {
        if (currentFrame()) addWithNesting();
      },
      "ConditionalExpression:exit"() {
        if (currentFrame()) decrementNesting();
      },

      LogicalExpression(node: LogicalExpression) {
        if (!currentFrame()) return;
        if (coveredLogicalNodes.has(node)) return;
        const flattened = flattenLogicalExpression(node);
        let prev: LogicalExpression | undefined;
        for (const cur of flattened) {
          if (
            cur.operator !== "||" &&
            cur.operator !== "??" &&
            (!prev || prev.operator !== cur.operator)
          ) {
            addFlat();
          }
          prev = cur;
        }
      },

      BreakStatement(node) {
        if (node.label && currentFrame()) addFlat();
      },

      ContinueStatement(node) {
        if (node.label && currentFrame()) addFlat();
      },
    };
  },
};
