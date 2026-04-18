import type { RuleContext } from "../rules";
import type { ReportOccurrence } from "../rules/types.js";

export interface ResolvedReport {
  ruleId: string;
  description: string;
  suggestion?: string;
  occurrences?: ReportOccurrence[];
}

export interface Reporter {
  report(collectorContexts: Map<string, RuleContext>): void;
}
