import type { Report } from "../types/index.js";

/**
 * Reporter formats and outputs analysis reports
 */
export interface Reporter {
  /**
   * Output the reports
   */
  report(reports: Report[]): Promise<void> | void;

  /**
   * Reporter name/type
   */
  readonly name: string;
}
