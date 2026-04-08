import type { RuleInfo } from "../../types/index.js";

export type StringLiteralContext = "variable" | "expression";

export type StringLiteralInfo = RuleInfo<{
  value: string;
  context: StringLiteralContext;
}>;

export interface StringLiteralGroup {
  value: string;
  count: number;
  occurrences: StringLiteralInfo[];
}
