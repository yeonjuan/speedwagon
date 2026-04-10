import type { Rule } from "../rules/index.js";
import { jsLanguage } from "../languages/js/index.js";
import { tsLanguage } from "../languages/ts/index.js";
import { jsxLanguage } from "../languages/jsx/index.js";
import { tsxLanguage } from "../languages/tsx/index.js";
import type { Language } from "../languages/types.js";
import { readFile } from "fs/promises";
import { CollectorContext, type Collector } from "../collectors/index.js";
import { Visitor } from "oxc-parser";
import { RuleContext } from "../rules/index.js";
import { nullishThrows } from "../utils/nullish-throws.js";

export interface RunnerConfig {
  paths: string[];
  rules: Rule[];
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
      this.config.rules.map((rule) => [rule.id, new RuleContext()]),
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
      await this.checkRule(rule);
    }
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

  private async checkRule(rule: Rule) {
    const context = nullishThrows(
      this.ruleContexts.get(rule.id),
      "rule context id:" + rule.id,
    );
    rule.check(
      context,
      rule.collectors.map(
        (collector) => this.collectContexts.get(collector.id)!,
      ),
    );
  }
}
