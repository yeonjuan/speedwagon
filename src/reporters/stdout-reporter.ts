import type { RuleContext } from "../rules";
import type { Reporter } from "./types";

export class StdoutReporter implements Reporter {
  report(ruleContexts: Map<string, RuleContext>): void {
    for (const [ruleId, ruleContext] of ruleContexts) {
      const reports = ruleContext.getReports();
      if (reports.length === 0) continue;

      console.log(`\n[${ruleId}]`);
      for (const report of reports) {
        console.log(`  description: ${report.description}`);
        if (report.suggestion) {
          console.log(`  suggestion: ${report.suggestion}`);
        }
        if (report.occurrences && report.occurrences.length > 0) {
          console.log(`  occurrences:`);
          for (const occurrence of report.occurrences) {
            const { line, column } = occurrence.location.start;
            console.log(`    - ${occurrence.path}:${line}:${column}`);
          }
        }
      }
    }
  }
}
