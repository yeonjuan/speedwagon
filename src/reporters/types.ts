import type { ReportOccurrence } from "../rules/types.js";

export interface ResolvedReport {
  ruleId: string;
  description: string;
  suggestion?: string;
  occurrences?: ReportOccurrence[];
}

export interface Reporter {
  report(reports: ResolvedReport[]): Promise<void> | void;
  readonly name: string;
}
