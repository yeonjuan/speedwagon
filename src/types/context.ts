import type { Report } from "./report.js";

export type Maybe<T> = T | undefined;

export interface CollectorContext {
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
