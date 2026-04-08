import type { RuleInfo } from "../../types/index.js";

export type LogicalExpressionInfo = RuleInfo<{
  normalized: string;
  raw: string;
  operandsCount: number;
}>;

export interface LogicalExpressionGroup {
  normalized: string;
  occurrences: LogicalExpressionInfo[];
  count: number;
}
