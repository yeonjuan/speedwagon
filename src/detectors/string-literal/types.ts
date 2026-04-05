import type { DetectorInfo } from "../../types/index.js";

export type StringLiteralContext = "variable" | "expression";

export type StringLiteralInfo = DetectorInfo<{
  value: string;
  context: StringLiteralContext;
}>;

export interface StringLiteralGroup {
  value: string;
  count: number;
  occurrences: StringLiteralInfo[];
}
