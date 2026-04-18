import type { RuleContext } from "../rules";
import type { Reporter } from "./types";

const c = {
  bold: (s: string) => `\x1b[1m${s}\x1b[22m`,
  cyan: (s: string) => `\x1b[36m${s}\x1b[39m`,
  yellow: (s: string) => `\x1b[33m${s}\x1b[39m`,
  dim: (s: string) => `\x1b[2m${s}\x1b[22m`,
};

export class StdoutReporter implements Reporter {
  report(ruleContexts: Map<string, RuleContext>): void {
    for (const [ruleId, ruleContext] of ruleContexts) {
      const reports = ruleContext.getReports();
      if (reports.length === 0) continue;

      console.log(`\n${c.bold(c.cyan(`[${ruleId}]`))}`);
      for (const report of reports) {
        console.log(`\n  ${c.yellow(report.description)}`);
        if (report.occurrences && report.occurrences.length > 0) {
          for (const occurrence of report.occurrences) {
            const { line, column } = occurrence.location.start;
            console.log(
              `    ${c.dim(occurrence.path + ":")}${c.dim(`${line}:${column}`)}`,
            );
          }
        }
      }
    }
  }
}
