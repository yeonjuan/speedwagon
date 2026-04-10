import type { Collector, CollectorContext } from "../collectors/index.js";
import type { RuleContext } from "./rule-context.js";

type CollectorContexts<TCollectors extends Collector[]> = {
  [K in keyof TCollectors]: CollectorContext;
};

export interface Rule<TCollectors extends Collector[] = Collector[]> {
  id: string;
  description: string;
  collectors: TCollectors;
  check(
    context: RuleContext,
    collectorContexts: CollectorContexts<TCollectors>,
  ): void;
}

export interface RuleContextMutationAPI {
  report(): void;
}

export interface Report {}
