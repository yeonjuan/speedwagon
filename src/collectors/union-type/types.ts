import type { CollectorInfo } from "../../types/index.js";

export type UnionTypeInfo = CollectorInfo<{ types: string[]; raw: string }>;

export interface UnionTypeGroup {
  types: string[];
  occurrences: UnionTypeInfo[];
  count: number;
}
