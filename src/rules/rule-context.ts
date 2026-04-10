import type { Report, RuleContextMutationAPI } from "./types";

export class RuleContext implements RuleContextMutationAPI {
  report(report: Report) {}
}
