import {
  getPosition,
  createCollector,
  isStringLiteralNode,
} from "../../utils/index.js";
import type { StringLiteralInfo } from "./types.js";
import { TYPE_LITERAL, TYPE_STRING } from "../../constants.js";

export const stringLiteralCollector = createCollector(
  (context, filePath, sourceCode) => {
    let counter = 0;

    const shouldSkip = (value: string): boolean => {
      return value.length < 3;
    };

    function getExistingInfo(value: string): StringLiteralInfo[] {
      return context.get<StringLiteralInfo[]>(value) ?? [];
    }

    return {
      VariableDeclarator: (node) => {
        if (isStringLiteralNode(node.init)) {
          const value = node.init.value;
          if (shouldSkip(value)) return;

          const existing = getExistingInfo(value);
          const info: StringLiteralInfo = {
            id: `${filePath}:${counter++}`,
            value,
            location: {
              file: filePath,
              start: getPosition(sourceCode, node.init.start),
              end: getPosition(sourceCode, node.init.end),
            },
            context: "variable",
          };
          existing.push(info);
          context.set(value, existing);
        }
      },
      CallExpression: (node) => {
        for (const arg of node.arguments) {
          if (isStringLiteralNode(arg)) {
            const value = arg.value;
            if (shouldSkip(value)) return;

            const existing = getExistingInfo(value);
            const info: StringLiteralInfo = {
              id: `${filePath}:${counter++}`,
              value,
              location: {
                file: filePath,
                start: getPosition(sourceCode, arg.start),
                end: getPosition(sourceCode, arg.end),
              },
              context: "expression",
            };
            existing.push(info);
            context.set(value, existing);
          }
        }
      },
      ReturnStatement: (node) => {
        if (isStringLiteralNode(node.argument)) {
          const value = node.argument.value;
          if (shouldSkip(value)) return;

          const existing = getExistingInfo(value);
          const info: StringLiteralInfo = {
            id: `${filePath}:${counter++}`,
            value,
            location: {
              file: filePath,
              start: getPosition(sourceCode, node.argument.start),
              end: getPosition(sourceCode, node.argument.end),
            },
            context: "expression",
          };
          existing.push(info);
          context.set(value, existing);
        }
      },
      BinaryExpression: (node) => {
        if (isStringLiteralNode(node.left)) {
          const value = node.left.value;
          if (!shouldSkip(value)) {
            const existing = getExistingInfo(value);
            const info: StringLiteralInfo = {
              id: `${filePath}:${counter++}`,
              value,
              location: {
                file: filePath,
                start: getPosition(sourceCode, node.left.start),
                end: getPosition(sourceCode, node.left.end),
              },
              context: "expression",
            };
            existing.push(info);
            context.set(value, existing);
          }
        }
        if (isStringLiteralNode(node.right)) {
          const value = node.right.value;
          if (!shouldSkip(value)) {
            const existing = getExistingInfo(value);
            const info: StringLiteralInfo = {
              id: `${filePath}:${counter++}`,
              value,
              location: {
                file: filePath,
                start: getPosition(sourceCode, node.right.start),
                end: getPosition(sourceCode, node.right.end),
              },
              context: "expression",
            };
            existing.push(info);
            context.set(value, existing);
          }
        }
      },
    };
  },
);
