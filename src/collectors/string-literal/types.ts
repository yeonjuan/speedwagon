import type { CollectorInfo } from "../../types/index.js";

export type StringLiteralContext = "variable" | "expression";

export type StringLiteralInfo = CollectorInfo<{
  value: string;
  context: StringLiteralContext;
}>;

export interface StringLiteralGroup {
  value: string;
  count: number;
  occurrences: StringLiteralInfo[];
}
