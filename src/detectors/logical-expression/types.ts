import type { Location } from "../../types/index.js";

export interface LogicalExpressionInfo {
  id: string;
  normalized: string;
  raw: string;
  operandsCount: number;
  location: Location;
}

export interface LogicalExpressionGroup {
  normalized: string;
  occurrences: LogicalExpressionInfo[];
  count: number;
}
