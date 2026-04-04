import { Visitor, type VisitorObject } from "oxc-parser";
import type { Collector, DetectorContext } from "../types/index.js";

export type VisitorFactory = (
  context: DetectorContext,
  filePath: string,
  sourceCode: string,
) => VisitorObject;

export function createCollector(
  visitorFactory: VisitorFactory,
): (context: DetectorContext, filePath: string, sourceCode: string) => Collector {
  return (
    context: DetectorContext,
    filePath: string,
    sourceCode: string,
  ): Collector => {
    return {
      context,
      filePath,
      visitor(): Visitor {
        const visitorObject = visitorFactory(context, filePath, sourceCode);
        return new Visitor(visitorObject);
      },
    };
  };
}
