import type { DetectorInfo } from "../../types/index.js";

export type StringInterpolationInfo = DetectorInfo<Record<string, unknown>>;

export interface StringInterpolationGroup {
  normalized: string;
  count: number;
  occurrences: StringInterpolationInfo[];
}
