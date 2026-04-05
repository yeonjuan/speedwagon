import type { VisitorObject } from "oxc-parser";
import type { UnionTypeInfo } from "./types.js";
import {
  getPosition,
  createCollector,
  extractSnippet,
} from "../../utils/index.js";
import { TYPE_STRING, AST_TYPES } from "../../constants/index.js";

function extractTypeName(type: any): string | null {
  if (!type) return null;

  switch (type.type) {
    case AST_TYPES.TSLiteralType:
      if (type.literal.type === AST_TYPES.Literal) {
        if (typeof type.literal.value === TYPE_STRING) {
          return `"${type.literal.value}"`;
        }
        if (typeof type.literal.value === "number") {
          return String(type.literal.value);
        }
        if (typeof type.literal.value === "boolean") {
          return String(type.literal.value);
        }
        if (type.literal.value === null) {
          return "null";
        }
      }
      return null;

    case AST_TYPES.TSTypeReference:
      if (type.typeName?.type === AST_TYPES.Identifier) {
        return type.typeName.name;
      }
      return null;

    case AST_TYPES.TSStringKeyword:
      return TYPE_STRING;

    case AST_TYPES.TSNumberKeyword:
      return "number";

    case AST_TYPES.TSBooleanKeyword:
      return "boolean";

    case AST_TYPES.TSNullKeyword:
      return "null";

    case AST_TYPES.TSUndefinedKeyword:
      return "undefined";

    case AST_TYPES.TSVoidKeyword:
      return "void";

    case AST_TYPES.TSAnyKeyword:
      return "any";

    case AST_TYPES.TSUnknownKeyword:
      return "unknown";

    case AST_TYPES.TSNeverKeyword:
      return "never";

    default:
      return null;
  }
}

export const unionTypeCollector = createCollector(
  (context, filePath, sourceCode) => {
    let counter = 0;

    function collectUnionType(
      types: string[],
      raw: string,
      start: number,
      end: number,
    ): void {
      const id = `${filePath}:${counter++}`;
      const startPos = getPosition(sourceCode, start);
      const endPos = getPosition(sourceCode, end);

      const location = {
        file: filePath,
        start: startPos,
        end: endPos,
      };
      const snippet = extractSnippet(sourceCode, location, { expandLines: 1 });
      const key = types.join(" | ");

      context.addInfo(key, id, location, snippet, { types, raw });
    }

    return {
      [AST_TYPES.TSUnionType]: (node) => {
        const types = node.types
          .map((type) => extractTypeName(type))
          .filter((name): name is string => name !== null)
          .sort();

        if (types.length < 2) return;

        const raw = sourceCode.slice(node.start, node.end);
        collectUnionType(types, raw, node.start, node.end);
      },
    };
  },
);
