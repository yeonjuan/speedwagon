import { format } from "../utils/index.js";
import type { ResolvedReport } from "./types.js";
import type { Report, Rule, RuleContextMutationAPI } from "./types.js";

export class RuleContext implements RuleContextMutationAPI {
  private readonly reports: ResolvedReport[] = [];

  constructor(private readonly rule: Rule) {}

  report({ descriptionId, data, occurrences }: Report) {
    const descriptionTemplate =
      this.rule.descriptions[descriptionId] ?? descriptionId;

    this.reports.push({
      ruleId: this.rule.id,
      description: format.template(descriptionTemplate, data),
      occurrences,
    });
  }

  getReports(): ResolvedReport[] {
    return this.reports;
  }

  getCategory(): Rule["category"] {
    return this.rule.category;
  }
}
