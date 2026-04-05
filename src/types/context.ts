import type { Report } from "./report.js";

export type Maybe<T> = T | undefined;

export interface CollectorContext {
  set<T>(key: string, value: T): void;
  get<T>(key: string): Maybe<T>;
  getAll<T>(): Map<string, T>;
  has(key: string): boolean;
  clear(): void;
  addInfo<T>(
    key: string,
    id: string,
    location: Location,
    snippet: string,
    data: T,
  ): void;
  getAllInfos<T>(): Map<string, CollectorInfo<T>[]>;
}

export interface GlobalContext {
  store: Store;

  set<T>(namespace: string, key: string, value: T): void;

  get<T>(namespace: string, key: string): Maybe<T>;

  getAll<T>(namespace: string): Map<string, T>;

  has(namespace: string, key: string): boolean;

  clear(namespace: string): void;

  size(): number;

  createCollectorContext(namespace: string): CollectorContext;
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

export interface CollectorInfo<T = Record<string, unknown>> {
  id: string;
  location: Location;
  snippet: string;
  data: T;
}
