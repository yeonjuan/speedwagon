import type { Visitor, VisitorObject } from "oxc-parser";
import type { Location } from "../types/index.js";

export interface CollectAddData {
  key: string;
  name: string;
  location: Location;
}

export type CollectRecord = Pick<CollectAddData, "location">;

export interface Collection extends CollectAddData {
  path: string;
}

export interface CollectorContextMutationAPI {
  readonly path: string;
  readonly code: string;
  add(data: CollectAddData): void;
}

export interface CollectorQueryAPI {
  keys(): Iterable<string>;
  getByKey(key: string): Collection[];
}

export interface VisitorInstance {
  context: CollectorContextMutationAPI;
  path: string;
  visitor(): Visitor;
}

export type VisitorFactory = (
  context: CollectorContextMutationAPI,
  path: string,
  code: string,
) => VisitorInstance;

export interface Collector {
  id: string;
  createJSVisitor: (context: CollectorContextMutationAPI) => VisitorObject;
}
