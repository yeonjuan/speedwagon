/**
 * GlobalContext stores all collected metadata during Phase 1
 * and provides it to Analyzers in Phase 2
 */
export interface GlobalContext {
  /**
   * Store arbitrary data collected by detectors
   * Each detector can namespace its data using a unique key
   */
  store: Store;

  /**
   * Add data to the store under a specific namespace
   */
  set<T>(namespace: string, key: string, value: T): void;

  /**
   * Get data from the store
   */
  get<T>(namespace: string, key: string): T | undefined;

  /**
   * Get all data for a namespace
   */
  getAll<T>(namespace: string): Map<string, T>;

  /**
   * Check if a key exists in a namespace
   */
  has(namespace: string, key: string): boolean;

  /**
   * Clear all data in a namespace
   */
  clear(namespace: string): void;

  /**
   * Get total number of entries across all namespaces
   */
  size(): number;
}

/**
 * Store is a nested Map structure for organizing collected metadata
 * First level: namespace (detector name)
 * Second level: key-value pairs of collected data
 */
export type Store = Map<string, Map<string, unknown>>;

export interface Position {
  line: number;
  column: number;
}

export interface Location {
  file: string;
  start: Position;
  end: Position;
}
