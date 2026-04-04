import { Visitor, type VisitorObject } from "oxc-parser";
import type { Collector, GlobalContext } from "../../types/index.js";
import type { UnionTypeInfo } from "./types.js";
import { getPosition } from "../../utils/index.js";

export class UnionTypeCollector implements Collector {
  public readonly context: GlobalContext;
  public readonly filePath: string;
  private readonly namespace = "union-type";
  private counter = 0;
  private sourceCode: string;

  constructor(context: GlobalContext, filePath: string, sourceCode: string) {
    this.context = context;
    this.filePath = filePath;
    this.sourceCode = sourceCode;
  }

  visitor(): Visitor {
    const visitorObject: VisitorObject = {
      TSUnionType: (node) => {
        const types = node.types
          .map((type) => this.extractTypeName(type))
          .filter((name): name is string => name !== null)
          .sort();

        if (types.length < 2) return;

        const raw = this.sourceCode.slice(node.start, node.end);
        this.collectUnionType(types, raw, node.start, node.end);
      },
    };

    return new Visitor(visitorObject);
  }

  private extractTypeName(type: any): string | null {
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

  private collectUnionType(
    types: string[],
    raw: string,
    start: number,
    end: number,
  ): void {
    const id = `${this.filePath}:${this.counter++}`;
    const startPos = getPosition(this.sourceCode, start);
    const endPos = getPosition(this.sourceCode, end);

    const unionType: UnionTypeInfo = {
      id,
      types,
      raw,
      location: {
        file: this.filePath,
        start: startPos,
        end: endPos,
      },
    };

    const key = types.join(" | ");
    const existing = this.context.get<UnionTypeInfo[]>(this.namespace, key);

    if (existing) {
      existing.push(unionType);
      this.context.set(this.namespace, key, existing);
    } else {
      this.context.set(this.namespace, key, [unionType]);
    }
  }
}
