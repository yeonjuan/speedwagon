import type { RuleInfo } from "../../types/index.js";

export type StringInterpolationInfo = RuleInfo<Record<string, unknown>>;

export interface StringInterpolationGroup {
  normalized: string;
  count: number;
  occurrences: StringInterpolationInfo[];
}
