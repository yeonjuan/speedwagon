import type { RuleContext } from "../rules/index.js";

export interface Reporter {
  report(collectorContexts: Map<string, RuleContext>): void;
}
