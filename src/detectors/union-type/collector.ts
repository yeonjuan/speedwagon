import type { VisitorObject } from "oxc-parser";
import type { UnionTypeInfo } from "./types.js";
import { getPosition, createCollector } from "../../utils/index.js";

function extractTypeName(type: any): string | null {
  if (!type) return null;

  switch (type.type) {
    case "TSLiteralType":
      if (type.literal.type === "Literal") {
        if (typeof type.literal.value === "string") {
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
      if (type.typeName?.type === "Identifier") {
        return type.typeName.name;
      }
      return null;

    case "TSStringKeyword":
      return "string";

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

      const unionType: UnionTypeInfo = {
        id,
        types,
        raw,
        location: {
          file: filePath,
          start: startPos,
          end: endPos,
        },
      };

      const key = types.join(" | ");
      const existing = context.get<UnionTypeInfo[]>(key);

      if (existing) {
        existing.push(unionType);
        context.set(key, existing);
      } else {
        context.set(key, [unionType]);
      }
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
