import type { DetectorInfo } from "../../types/index.js";

export type UnionTypeInfo = DetectorInfo<{ types: string[]; raw: string }>;

export interface UnionTypeGroup {
  types: string[];
  occurrences: UnionTypeInfo[];
  count: number;
}
