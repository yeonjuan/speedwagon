import { Visitor, type VisitorObject } from "oxc-parser";
import type { RuleContext, VisitorInstance } from "../types/index.js";

type RawVisitorFactory = (
  context: RuleContext,
  filePath: string,
  sourceCode: string,
) => VisitorObject;

export function createRule(
  factory: RawVisitorFactory,
): (
  context: RuleContext,
  filePath: string,
  sourceCode: string,
) => VisitorInstance {
  return (
    context: RuleContext,
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
