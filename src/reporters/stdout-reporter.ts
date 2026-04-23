import { RuleCategory } from "../rules/index.js";
import type { RuleContext } from "../rules/index.js";
import type { Reporter } from "./types";

const c = {
  bold: (s: string) => `\x1b[1m${s}\x1b[22m`,
  cyan: (s: string) => `\x1b[36m${s}\x1b[39m`,
  yellow: (s: string) => `\x1b[33m${s}\x1b[39m`,
  dim: (s: string) => `\x1b[2m${s}\x1b[22m`,
  magenta: (s: string) => `\x1b[35m${s}\x1b[39m`,
};

const CATEGORY_ORDER = [
  RuleCategory.Complexity,
  RuleCategory.Duplication,
] as const;

export class StdoutReporter implements Reporter {
  report(ruleContexts: Map<string, RuleContext>): void {
    const grouped = new Map<string, Map<string, RuleContext>>();
    for (const category of CATEGORY_ORDER) {
      grouped.set(category, new Map());
    }

    for (const [ruleId, ruleContext] of ruleContexts) {
      const category = ruleContext.getCategory();
      grouped.get(category)!.set(ruleId, ruleContext);
    }

    for (const category of CATEGORY_ORDER) {
      const categoryContexts = grouped.get(category)!;
      const hasReports = [...categoryContexts.values()].some(
        (ctx) => ctx.getReports().length > 0,
      );
      if (!hasReports) continue;

      console.log(`\n${c.bold(c.magenta(`=== ${category} ===`))}`);

      for (const [ruleId, ruleContext] of categoryContexts) {
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
}
