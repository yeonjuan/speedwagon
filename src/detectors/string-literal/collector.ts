import { getPosition, createCollector } from "../../utils/index.js";
import type { StringLiteralInfo } from "./types.js";

export const stringLiteralCollector = createCollector(
  (context, filePath, sourceCode) => {
    let counter = 0;

    const shouldSkip = (value: string): boolean => {
      return value.length < 3;
    };

    return {
      VariableDeclarator: (node) => {
        if (
          node.init?.type === "Literal" &&
          typeof node.init.value === "string"
        ) {
          const value = node.init.value;
          if (shouldSkip(value)) return;

          const existing = context.get<StringLiteralInfo[]>(value) ?? [];
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
          if (arg.type === "Literal" && typeof arg.value === "string") {
            const value = arg.value;
            if (shouldSkip(value)) return;

            const existing = context.get<StringLiteralInfo[]>(value) ?? [];
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
        if (
          node.argument?.type === "Literal" &&
          typeof node.argument.value === "string"
        ) {
          const value = node.argument.value;
          if (shouldSkip(value)) return;

          const existing = context.get<StringLiteralInfo[]>(value) ?? [];
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
        if (
          node.left.type === "Literal" &&
          typeof node.left.value === "string"
        ) {
          const value = node.left.value;
          if (!shouldSkip(value)) {
            const existing = context.get<StringLiteralInfo[]>(value) ?? [];
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
        if (
          node.right.type === "Literal" &&
          typeof node.right.value === "string"
        ) {
          const value = node.right.value;
          if (!shouldSkip(value)) {
            const existing = context.get<StringLiteralInfo[]>(value) ?? [];
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
