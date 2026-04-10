import type { Reporter, ResolvedReport } from "./types.js";
import chalk from "chalk";

export class StdoutReporter implements Reporter {
  readonly name = "stdout";

  report(reports: ResolvedReport[]): void {
    if (reports.length === 0) {
      console.log(chalk.green("No duplicates found."));
      return;
    }
    reports.forEach((report, index) => this.printReport(report, index));
    console.log(chalk.yellow(`\n${reports.length} problem(s) found.`));
  }

  private printReport(report: ResolvedReport, index: number): void {
    console.log(
      chalk.bold(`${index + 1}. [${report.ruleId}] ${report.description}`),
    );
    if (report.suggestion) {
      console.log(chalk.gray(`   Suggestion: ${report.suggestion}`));
    }
  }
}
