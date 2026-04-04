import type { Location } from "../../types/index.js";

export type LiteralType = "number";

export interface ConstantLiteral {
  id: string;

  value: number;

  type: LiteralType;

  location: Location;

  context?: string;
}

export interface ConstantGroup {
  value: number;

  type: LiteralType;

  occurrences: ConstantLiteral[];

  count: number;
}
