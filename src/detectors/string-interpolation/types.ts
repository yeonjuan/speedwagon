import type { Location } from "../../types/index.js";

export interface StringInterpolationInfo {
  id: string;
  normalized: string;
  raw: string;
  location: Location;
}

export interface StringInterpolationGroup {
  normalized: string;
  count: number;
  occurrences: StringInterpolationInfo[];
}
