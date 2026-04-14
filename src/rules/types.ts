import type { Collector, CollectorContext } from "../collectors/index.js";
import type { Location } from "../types/location.js";
import type { RuleContext } from "./rule-context.js";

type CollectorContexts<TCollectors extends Collector<any>[]> = {
  [K in keyof TCollectors]: CollectorContext;
};

export interface Rule<TCollectors extends Collector<any>[] = Collector<any>[]> {
  id: string;
  collectors: TCollectors;
  descriptions: {
    [id: string]: string;
  };
  suggestions: {
    [id: string]: string;
  };
  check(
    context: RuleContext,
    collectorContexts: CollectorContexts<TCollectors>,
  ): void;
}

export interface RuleContextMutationAPI {
  report(report: Report): void;
}

export interface ReportOccurrence {
  path: string;
  location: import("../types/index.js").Location;
}

export interface Report {
  descriptionId: string;
  suggestionId?: string;
  data?: Record<string, unknown>;
  path: string;
  location: Location;
}
