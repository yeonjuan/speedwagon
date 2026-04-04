import type { Visitor } from "oxc-parser";
import type { GlobalContext } from "./context.js";

export interface Collector {
  context: GlobalContext;
  filePath: string;
  visitor(): Visitor;
}

export type CollectorFactory = (
  context: GlobalContext,
  filePath: string,
  sourceCode: string,
) => Collector;
