import type { VisitorObject } from "oxc-parser";
import type { UnionTypeInfo } from "./types.js";
import {
  getPosition,
  createCollector,
  extractSnippet,
} from "../../utils/index.js";
import { TYPE_LITERAL, TYPE_STRING, TYPE_IDENTIFIER } from "../../constants.js";

function extractTypeName(type: any): string | null {
  if (!type) return null;

  switch (type.type) {
    case "TSLiteralType":
      if (type.literal.type === TYPE_LITERAL) {
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

    case "TSTypeReference":
      if (type.typeName?.type === TYPE_IDENTIFIER) {
        return type.typeName.name;
      }
      return null;

    case "TSStringKeyword":
      return TYPE_STRING;

    case "TSNumberKeyword":
      return "number";

    case "TSBooleanKeyword":
      return "boolean";

    case "TSNullKeyword":
      return "null";

    case "TSUndefinedKeyword":
      return "undefined";

    case "TSVoidKeyword":
      return "void";

    case "TSAnyKeyword":
      return "any";

    case "TSUnknownKeyword":
      return "unknown";

    case "TSNeverKeyword":
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
      TSUnionType: (node) => {
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
