import type { Report } from "../rules/index.js";

export interface Reporter {
  report(reports: Report[]): Promise<void> | void;
  readonly name: string;
}
