import type { Location } from "./context.js";

export interface Report {
  type: string;

  similarity: number;

  duplicates: DuplicateEntry[];

  description?: string;

  suggestion?: string;
}

export interface DuplicateEntry {
  location: Location;

  snippet: string;

  metadata?: Record<string, unknown>;
}
