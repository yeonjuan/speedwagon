import type { Visitor, VisitorObject } from "oxc-parser";
import type { Location } from "../types";

export interface CollectParams {
  key: string;
  location: Location;
}

export interface CollectResult extends CollectParams {
  path: string;
}

export interface CollectorContext {
  path: string;
  code: string;
  add(data: CollectParams): void;
}

export interface VisitorInstance {
  context: CollectorContext;
  path: string;
  visitor(): Visitor;
}

export type VisitorFactory = (
  context: CollectorContext,
  path: string,
  code: string,
) => VisitorInstance;

export interface Collector {
  id: string;
  createJSVisitor: (context: CollectorContext) => VisitorObject;
}
