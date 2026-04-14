import type { Visitor, VisitorObject } from "oxc-parser";
import type { Location } from "../types/index.js";

export type CollectAddData<
  Data extends Record<string, unknown> | undefined = undefined,
> = Data extends undefined
  ? { key: string; location: Location; data?: undefined }
  : { key: string; location: Location; data: Data };

export type CollectRecord = Pick<CollectAddData, "location" | "data">;

export interface Collection extends CollectAddData {
  path: string;
}

export interface CollectorContextMutationAPI<
  Additional extends Record<string, unknown> | undefined = undefined,
> {
  readonly path: string;
  readonly code: string;
  add(data: CollectAddData<Additional>): void;
}

export interface CollectorQueryAPI {
  keys(): Iterable<string>;
  getByKey(key: string): Collection[];
}

export interface VisitorInstance {
  context: CollectorContextMutationAPI<undefined>;
  path: string;
  visitor(): Visitor;
}

export type VisitorFactory = (
  context: CollectorContextMutationAPI,
  path: string,
  code: string,
) => VisitorInstance;

export interface Collector<
  Data extends Record<string, unknown> | undefined = undefined,
> {
  id: string;
  createJSVisitor: (
    context: CollectorContextMutationAPI<Data>,
  ) => VisitorObject;
}
