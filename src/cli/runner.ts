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
import { nullishThrows } from "../utils/index.js";
import { StdoutReporter } from "../reporters/stdout-reporter.js";
import { HtmlReporter } from "../reporters/html-reporter.js";
import type { ReportFormat } from "./optionator.js";

interface RunnerConfig {
  paths: string[];
  rules: Rule[];
  format?: ReportFormat;
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

  async run(): Promise<string | undefined> {
    for (const path of this.config.paths) {
      await this.collectFromFile(path);
    }
    for (const rule of this.config.rules) {
      this.checkRule(rule);
    }

    if (this.config.format === "html") {
      const reporter = new HtmlReporter();
      return reporter.report(this.ruleContexts);
    }

    const reporter = new StdoutReporter();
    reporter.report(this.ruleContexts);
    return undefined;
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
