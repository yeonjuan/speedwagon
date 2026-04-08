import type { VisitorObject, Visitor } from "oxc-parser";
import type { RuleContext } from "./context.js";
import type { Report } from "./report.js";

export interface VisitorInstance {
  context: RuleContext;
  filePath: string;
  visitor(): Visitor;
}

export type VisitorFactory = (
  context: RuleContext,
  filePath: string,
  sourceCode: string,
) => VisitorInstance;

export interface Rule {
  readonly name: string;
  readonly description: string;
  createVisitor: VisitorFactory;
  report(context: RuleContext): Report[];
}

export interface RuleConfig {
  minOccurrences?: number;
  options?: Record<string, unknown>;
}
