import type { Report } from "../types/index.js";

export interface Reporter {
  report(reports: Report[]): Promise<void> | void;
  readonly name: string;
}
