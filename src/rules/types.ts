import type { Collector, CollectorContext } from "../collectors/index.js";
import type { RuleContext } from "./rule-context.js";

export enum RuleCategory {
  Complexity = "complexity",
  Duplication = "duplication",
}

type CollectorContexts<TCollectors extends Collector[]> = {
  [K in keyof TCollectors]: CollectorContext;
};

export interface ResolvedReport {
  ruleId: string;
  description: string;
  occurrences?: ReportOccurrence[];
}

export interface Rule<TCollectors extends Collector[] = Collector[]> {
  id: string;
  category: RuleCategory;
  collectors: TCollectors;
  descriptions: {
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
  data?: Record<string, unknown>;
  occurrences?: ReportOccurrence[];
}
