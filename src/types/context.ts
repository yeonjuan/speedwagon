export interface GlobalContext {
  store: Store;

  set<T>(namespace: string, key: string, value: T): void;

  get<T>(namespace: string, key: string): T | undefined;

  getAll<T>(namespace: string): Map<string, T>;

  has(namespace: string, key: string): boolean;

  clear(namespace: string): void;

  size(): number;
}

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
