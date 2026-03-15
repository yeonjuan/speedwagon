import type { Location } from "./context.js";

/**
 * Report represents a detected duplication/similarity
 * Generated during Phase 2 (Analysis Phase)
 */
export interface Report {
  /**
   * Type of duplication detected
   */
  type: string;

  /**
   * Similarity score (0-100)
   * 100 = exact duplicate, lower = structural similarity
   */
  similarity: number;

  /**
   * List of duplicate code locations
   */
  duplicates: DuplicateEntry[];

  /**
   * Optional: Description of the duplication
   */
  description?: string;

  /**
   * Optional: Suggestion for fixing
   */
  suggestion?: string;
}

/**
 * Represents one instance of duplicate code
 */
export interface DuplicateEntry {
  /**
   * Location of the duplicate
   */
  location: Location;

  /**
   * Code snippet
   */
  snippet: string;

  /**
   * Optional: Additional metadata
   */
  metadata?: Record<string, unknown>;
}
