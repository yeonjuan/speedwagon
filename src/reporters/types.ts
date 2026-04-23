import type { RuleContext } from "../rules";

export interface Reporter {
  report(
    ruleContexts: Map<string, RuleContext>,
  ): void | string | Promise<string>;
}
