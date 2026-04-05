import { Visitor, type VisitorObject } from "oxc-parser";
import type { CollectorContext, VisitorInstance } from "../types/index.js";

type RawVisitorFactory = (
  context: CollectorContext,
  filePath: string,
  sourceCode: string,
) => VisitorObject;

export function createCollector(
  factory: RawVisitorFactory,
): (
  context: CollectorContext,
  filePath: string,
  sourceCode: string,
) => VisitorInstance {
  return (
    context: CollectorContext,
    filePath: string,
    sourceCode: string,
  ): VisitorInstance => {
    return {
      context,
      filePath,
      visitor(): Visitor {
        const visitorObject = factory(context, filePath, sourceCode);
        return new Visitor(visitorObject);
      },
    };
  };
}
