import { readFile } from "fs/promises";
import { Visitor } from "oxc-parser";
import type { Rule } from "../rules/index.js";
import {
  jsLanguage,
  tsLanguage,
  jsxLanguage,
  tsxLanguage,
  type Language,
} from "../languages/index.js";
import { CollectorContext, type Collector } from "../collectors/index.js";
import { RuleContext } from "../rules/index.js";
import type { Reporter } from "../reporters/types.js";
import { nullishThrows } from "../utils/index.js";

export interface RunnerConfig {
  paths: string[];
  rules: Rule[];
  reporter: Reporter;
}

export class Runner {
  private languages: Language[] = [
    jsLanguage,
    tsLanguage,
    jsxLanguage,
    tsxLanguage,
  ];
  private collectors: Collector[];
  private collectContexts: Map<string, CollectorContext>;
  private ruleContexts: Map<string, RuleContext>;

  constructor(private readonly config: RunnerConfig) {
    this.collectors = [
      ...new Set(this.config.rules.flatMap((rule) => rule.collectors)).values(),
    ];
    this.ruleContexts = new Map(
      this.config.rules.map((rule) => [rule.id, new RuleContext(rule)]),
    );
    this.collectContexts = new Map(
      this.collectors.map((collector) => [
        collector.id,
        new CollectorContext(),
      ]),
    );
  }

  async run() {
    for (const path of this.config.paths) {
      await this.collectFromFile(path);
    }
    for (const rule of this.config.rules) {
      this.checkRule(rule);
    }
    const reports = this.config.rules.flatMap((rule) =>
      nullishThrows(
        this.ruleContexts.get(rule.id),
        `ruleContext id:${rule.id}`,
      ).getReports(),
    );
    return this.config.reporter.report(reports);
  }

  private async collectFromFile(path: string) {
    const language = this.languages.find((lang) => lang.match(path));
    if (!language) {
      console.error(`No language found for ${path}`);
      return;
    }
    const code = await readFile(path, "utf-8");
    const program = await language.parse(code, path);

    for (const collector of this.collectors) {
      const collectContext = this.collectContexts.get(collector.id)!;
      const collectContextAPI = collectContext.mutationApi(path, code);
      const visitor = new Visitor(collector.createJSVisitor(collectContextAPI));
      visitor.visit(program);
    }
  }

  private checkRule(rule: Rule) {
    const context = nullishThrows(
      this.ruleContexts.get(rule.id),
      `ruleContext id:${rule.id}`,
    );
    rule.check(
      context,
      rule.collectors.map(
        (collector) => this.collectContexts.get(collector.id)!,
      ),
    );
  }
}
