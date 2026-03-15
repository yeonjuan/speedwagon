import { Visitor, type VisitorObject, type Program } from "oxc-parser";
import type { Collector, GlobalContext } from "../../types/index.js";
import type { ConstantLiteral, LiteralType } from "./types.js";
import { getPosition } from "../../utils/index.js";

export class MagicNumberCollector implements Collector {
  public readonly context: GlobalContext;
  public readonly filePath: string;
  private readonly namespace = "magic-number";
  private counter = 0;
  private sourceCode: string;

  constructor(context: GlobalContext, filePath: string, sourceCode: string) {
    this.context = context;
    this.filePath = filePath;
    this.sourceCode = sourceCode;
  }

  onStart(): void {}

  onEnd(): void {}

  visit(program: Program): void {
    const visitorObject: VisitorObject = {
      Literal: (node) => {
        if (node.value === null) return;

        if (typeof node.value === "string") {
          if (node.value.length > 2) {
            this.collectLiteral(node.value, "string", node.start, node.end);
          }
        } else if (typeof node.value === "number") {
          if (this.shouldCollectNumber(node.value)) {
            this.collectLiteral(node.value, "number", node.start, node.end);
          }
        } else if (typeof node.value === "boolean") {
          this.collectLiteral(node.value, "boolean", node.start, node.end);
        } else if (typeof node.value === "bigint") {
          this.collectLiteral(node.value, "bigint", node.start, node.end);
        }
      },
    };

    const visitor = new Visitor(visitorObject);
    visitor.visit(program);
  }

  private collectLiteral(
    value: string | number | boolean | bigint,
    type: LiteralType,
    start: number,
    end: number,
  ): void {
    const id = `${this.filePath}:${this.counter++}`;
    const startPos = getPosition(this.sourceCode, start);
    const endPos = getPosition(this.sourceCode, end);

    const literal: ConstantLiteral = {
      id,
      value,
      type,
      location: {
        file: this.filePath,
        start: startPos,
        end: endPos,
      },
    };

    const key = `${type}:${String(value)}`;
    const existing = this.context.get<ConstantLiteral[]>(this.namespace, key);

    if (existing) {
      existing.push(literal);
      this.context.set(this.namespace, key, existing);
    } else {
      this.context.set(this.namespace, key, [literal]);
    }
  }

  private shouldCollectNumber(value: number): boolean {
    if (value === 0 || value === 1 || value === -1) {
      return false;
    }

    if (Number.isInteger(value) && value >= 2 && value <= 10) {
      return false;
    }

    return true;
  }
}
