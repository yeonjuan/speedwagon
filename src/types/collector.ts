import type { Program } from "oxc-parser";
import type { GlobalContext } from "./context.js";

export interface Collector {
  context: GlobalContext;
  filePath: string;
  visit(program: Program): void;
  onStart?(): void;
  onEnd?(): void;
}

export type CollectorFactory = (
  context: GlobalContext,
  filePath: string,
  sourceCode: string,
) => Collector;
