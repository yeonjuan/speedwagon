import {
  getPosition,
  createRule,
  isStringLiteralNode,
  extractSnippet,
  formatId,
} from "../../utils/index.js";
import { AST_TYPES } from "../../constants/index.js";

export interface StringLiteralRuleConfig {
  minOccurrences?: number;
}

export const stringLiteralRule = (config: StringLiteralRuleConfig) =>
  createRule((context, filePath, sourceCode) => {
    let counter = 0;

    const shouldSkip = (value: string): boolean => {
      return value.length < 3;
    };

    return {
      [AST_TYPES.VariableDeclarator]: (node) => {
        if (isStringLiteralNode(node.init)) {
          const value = node.init.value;
          if (shouldSkip(value)) return;

          const loc = {
            file: filePath,
            start: getPosition(sourceCode, node.init.start),
            end: getPosition(sourceCode, node.init.end),
          };
          const snippet = extractSnippet(sourceCode, loc);
          context.addInfo(value, formatId(filePath, counter++), loc, snippet, {
            value,
            context: "variable",
          });
        }
      },
      [AST_TYPES.CallExpression]: (node) => {
        for (const arg of node.arguments) {
          if (isStringLiteralNode(arg)) {
            const value = arg.value;
            if (shouldSkip(value)) return;

            const loc = {
              file: filePath,
              start: getPosition(sourceCode, arg.start),
              end: getPosition(sourceCode, arg.end),
            };
            const snippet = extractSnippet(sourceCode, loc);
            context.addInfo(
              value,
              formatId(filePath, counter++),
              loc,
              snippet,
              {
                value,
                context: "expression",
              },
            );
          }
        }
      },
      [AST_TYPES.ReturnStatement]: (node) => {
        if (isStringLiteralNode(node.argument)) {
          const value = node.argument.value;
          if (shouldSkip(value)) return;

          const loc = {
            file: filePath,
            start: getPosition(sourceCode, node.argument.start),
            end: getPosition(sourceCode, node.argument.end),
          };
          const snippet = extractSnippet(sourceCode, loc);
          context.addInfo(value, formatId(filePath, counter++), loc, snippet, {
            value,
            context: "expression",
          });
        }
      },
      [AST_TYPES.BinaryExpression]: (node) => {
        if (isStringLiteralNode(node.left)) {
          const value = node.left.value;
          if (!shouldSkip(value)) {
            const loc = {
              file: filePath,
              start: getPosition(sourceCode, node.left.start),
              end: getPosition(sourceCode, node.left.end),
            };
            const snippet = extractSnippet(sourceCode, loc);
            context.addInfo(
              value,
              formatId(filePath, counter++),
              loc,
              snippet,
              {
                value,
                context: "expression",
              },
            );
          }
        }
        if (isStringLiteralNode(node.right)) {
          const value = node.right.value;
          if (!shouldSkip(value)) {
            const loc = {
              file: filePath,
              start: getPosition(sourceCode, node.right.start),
              end: getPosition(sourceCode, node.right.end),
            };
            const snippet = extractSnippet(sourceCode, loc);
            context.addInfo(
              value,
              formatId(filePath, counter++),
              loc,
              snippet,
              {
                value,
                context: "expression",
              },
            );
          }
        }
      },
    };
  });
