import { format } from "../utils/index.js";
import type { Reporter } from "./types.js";
import { type Report } from "../rules/index.js";
import chalk from "chalk";

/**
 * Reporter that outputs to stdout with colored formatting
 */
export class StdoutReporter implements Reporter {
  readonly name = "stdout";

  report(reports: Report[]): void {}

  private printReport(report: Report, index: number): void {}
}
