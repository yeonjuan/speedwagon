import type { DetectorInfo } from "../../types/index.js";

export type LogicalExpressionInfo = DetectorInfo<{
  normalized: string;
  raw: string;
  operandsCount: number;
}>;

export interface LogicalExpressionGroup {
  normalized: string;
  occurrences: LogicalExpressionInfo[];
  count: number;
}
