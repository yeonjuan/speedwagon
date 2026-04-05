import type { CollectorInfo } from "../../types/index.js";

export type StringInterpolationInfo = CollectorInfo<Record<string, unknown>>;

export interface StringInterpolationGroup {
  normalized: string;
  count: number;
  occurrences: StringInterpolationInfo[];
}
