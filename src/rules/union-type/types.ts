import type { RuleInfo } from "../../types/index.js";

export type UnionTypeInfo = RuleInfo<{ types: string[]; raw: string }>;

export interface UnionTypeGroup {
  types: string[];
  occurrences: UnionTypeInfo[];
  count: number;
}
