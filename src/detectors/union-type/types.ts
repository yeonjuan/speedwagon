import type { Location } from "../../types/index.js";

export interface UnionTypeInfo {
  id: string;

  types: string[];

  location: Location;

  raw: string;
}

export interface UnionTypeGroup {
  types: string[];

  occurrences: UnionTypeInfo[];

  count: number;
}
