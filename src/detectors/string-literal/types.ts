import type { Location } from "../../types/index.js";

export interface StringLiteralInfo {
  id: string;
  value: string;
  location: Location;
  context: "variable" | "expression";
}
