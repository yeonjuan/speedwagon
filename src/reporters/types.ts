export interface ResolvedReport {
  ruleId: string;
  description: string;
  suggestion?: string;
}

export interface Reporter {
  report(reports: ResolvedReport[]): Promise<void> | void;
  readonly name: string;
}
