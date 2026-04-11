import type { Reporter, ResolvedReport } from "./types.js";

export class JsonReporter implements Reporter {
  readonly name = "json";

  report(reports: ResolvedReport[]): string {
    return JSON.stringify(reports, null, 2);
  }
}
