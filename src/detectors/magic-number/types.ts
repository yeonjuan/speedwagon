import type { Location } from "../../types/index.js";

/**
 * Type of constant literal
 */
export type LiteralType = "string" | "number" | "boolean" | "bigint";

/**
 * Represents a constant literal found in the code
 */
export interface ConstantLiteral {
  /**
   * Unique identifier
   */
  id: string;

  /**
   * The actual value
   */
  value: string | number | boolean | bigint;

  /**
   * Type of the literal
   */
  type: LiteralType;

  /**
   * Location in source code
   */
  location: Location;

  /**
   * Context where the literal appears
   * e.g., variable declaration, function call argument, etc.
   */
  context?: string;
}

/**
 * Group of duplicate constants
 */
export interface ConstantGroup {
  /**
   * The duplicated value
   */
  value: string | number | boolean | bigint;

  /**
   * Type of the literal
   */
  type: LiteralType;

  /**
   * All occurrences of this constant
   */
  occurrences: ConstantLiteral[];

  /**
   * Number of times this constant appears
   */
  count: number;
}
