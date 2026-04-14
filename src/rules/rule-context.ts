import { format } from "../utils/index.js";
import type { ResolvedReport } from "../reporters/types.js";
import type { Report, Rule, RuleContextMutationAPI } from "./types.js";

export class RuleContext implements RuleContextMutationAPI {
  private readonly reports: ResolvedReport[] = [];

  constructor(private readonly rule: Rule) {}

  report({ descriptionId, suggestionId, data }: Report) {
    const descriptionTemplate =
      this.rule.descriptions[descriptionId] ?? descriptionId;
    const suggestionTemplate =
      suggestionId != null
        ? (this.rule.suggestions[suggestionId] ?? suggestionId)
        : undefined;

    this.reports.push({
      ruleId: this.rule.id,
      description: format.template(descriptionTemplate, data),
      suggestion:
        suggestionTemplate != null
          ? format.template(suggestionTemplate, data)
          : undefined,
    });
  }

  getReports(): ResolvedReport[] {
    return this.reports;
  }
}
