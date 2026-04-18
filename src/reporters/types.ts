import type { RuleContext } from "../rules";

export interface Reporter {
  report(collectorContexts: Map<string, RuleContext>): void;
}
