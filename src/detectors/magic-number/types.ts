import type { Location } from "../../types/index.js";

export type LiteralType = "string" | "number" | "boolean" | "bigint";

export interface ConstantLiteral {
  id: string;

  value: string | number | boolean | bigint;

  type: LiteralType;

  location: Location;

  context?: string;
}

export interface ConstantGroup {
  value: string | number | boolean | bigint;

  type: LiteralType;

  occurrences: ConstantLiteral[];

  count: number;
}
