import type { VisitorObject, Visitor } from "oxc-parser";
import type { CollectorContext } from "./context.js";
import type { Report } from "./report.js";

export interface VisitorInstance {
  context: CollectorContext;
  filePath: string;
  visitor(): Visitor;
}

export type VisitorFactory = (
  context: CollectorContext,
  filePath: string,
  sourceCode: string,
) => VisitorInstance;

export interface Collector {
  readonly name: string;
  readonly description: string;
  createVisitor: VisitorFactory;
  report(context: CollectorContext): Report[];
}

export interface CollectorConfig {
  minOccurrences?: number;
  options?: Record<string, unknown>;
}
