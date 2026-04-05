import type { CollectorInfo } from "../../types/index.js";

export type LogicalExpressionInfo = CollectorInfo<{
  normalized: string;
  raw: string;
  operandsCount: number;
}>;

export interface LogicalExpressionGroup {
  normalized: string;
  occurrences: LogicalExpressionInfo[];
  count: number;
}
