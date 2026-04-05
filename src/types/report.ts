import type { Location } from "./context.js";

export interface Report {
  type: string;

  duplicates: DuplicateEntry[];

  description?: string;

  suggestion?: string;
}

export interface DuplicateEntry {
  location: Location;

  snippet: string;

  metadata?: Record<string, any>;
}
