import type { Visitor } from "oxc-parser";
import type { DetectorContext } from "./context.js";

export interface Collector {
  context: DetectorContext;
  filePath: string;
  visitor(): Visitor;
}

export type CollectorFactory = (
  context: DetectorContext,
  filePath: string,
  sourceCode: string,
) => Collector;
