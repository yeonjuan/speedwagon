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
import type { Config } from "../types/index.js";

interface RunnerConfig {
  paths: string[];
  rules: Rule[];
  config?: Config;
}

interface CollectorEntry {
  collector: Collector;
  options: Record<string, unknown>;
  key: string;
}

export class Runner {
  private languages: Language[] = [
    jsLanguage,
    tsLanguage,
    jsxLanguage,
    tsxLanguage,
  ];
  private collectorEntries: CollectorEntry[];
  private collectContexts: Map<string, CollectorContext>;
  private ruleContexts: Map<string, RuleContext>;
  private ruleOptions: Map<string, Record<string, unknown>>;

  constructor(private readonly config: RunnerConfig) {
    this.ruleOptions = this.resolveRuleOptions();
    this.collectorEntries = this.buildCollectorEntries();
    this.collectContexts = new Map(
      this.collectorEntries.map((entry) => [entry.key, new CollectorContext()]),
    );
    this.ruleContexts = new Map(
      this.config.rules.map((rule) => [rule.id, new RuleContext(rule)]),
    );
  }

  private resolveRuleOptions(): Map<string, Record<string, unknown>> {
    const cfg = this.config.config ?? {};
    return new Map(
      this.config.rules.map((rule) => {
        const baseOptions = rule.defaultOptions ?? {};
        const categoryConfig =
          (cfg as Record<string, Record<string, Record<string, unknown>>>)[
            rule.category
          ] ?? {};
        const ruleConfig = categoryConfig[rule.id] ?? {};
        return [rule.id, { ...baseOptions, ...ruleConfig }];
      }),
    );
  }

  private buildCollectorEntries(): CollectorEntry[] {
    const seen = new Set<string>();
    const entries: CollectorEntry[] = [];
    for (const rule of this.config.rules) {
      const options = this.ruleOptions.get(rule.id)!;
      const optionsStr = JSON.stringify(options);
      for (const collector of rule.collectors) {
        const key = `${collector.id}:${optionsStr}`;
        if (!seen.has(key)) {
          seen.add(key);
          entries.push({ collector, options, key });
        }
      }
    }
    return entries;
  }

  async run() {
    for (const path of this.config.paths) {
      await this.collectFromFile(path);
    }
    for (const rule of this.config.rules) {
      this.checkRule(rule);
    }
    const reporter = new StdoutReporter();
    reporter.report(this.ruleContexts);
  }

  private async collectFromFile(path: string) {
    const language = this.languages.find((lang) => lang.match(path));
    if (!language) {
      console.error(`No language found for ${path}`);
      return;
    }
    const code = await readFile(path, "utf-8");
    const program = await language.parse(code, path);

    for (const { collector, options, key } of this.collectorEntries) {
      const collectContext = this.collectContexts.get(key)!;
      const collectContextAPI = collectContext.mutationApi(path, code);
      const visitor = new Visitor(
        collector.createJSVisitor(collectContextAPI, options),
      );
      visitor.visit(program);
    }
  }

  private checkRule(rule: Rule) {
    const context = nullishThrows(
      this.ruleContexts.get(rule.id),
      `ruleContext id:${rule.id}`,
    );
    const options = this.ruleOptions.get(rule.id)!;
    const optionsStr = JSON.stringify(options);
    rule.check(
      context,
      rule.collectors.map(
        (collector) =>
          this.collectContexts.get(`${collector.id}:${optionsStr}`)!,
      ),
      options,
    );
  }
}
