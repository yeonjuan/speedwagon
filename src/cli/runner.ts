import path from "node:path";
import { readFile } from "fs/promises";
import { Visitor } from "oxc-parser";
import ignore from "ignore";
import type { Rule } from "../rules/index.js";
import {
  jsLanguage,
  tsLanguage,
  jsxLanguage,
  tsxLanguage,
  type Language,
} from "../languages/index.js";
import {
  CollectorContext,
  type Collector,
  type CollectorQueryAPI,
} from "../collectors/index.js";
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

class FilteredCollectorContext implements CollectorQueryAPI {
  private readonly isIgnored: (filePath: string) => boolean;

  constructor(
    private readonly inner: CollectorContext,
    ignorePatterns: string[],
  ) {
    const ig = ignore().add(ignorePatterns);
    this.isIgnored = (filePath: string) => {
      const rel = path
        .relative(process.cwd(), filePath)
        .split(path.sep)
        .join("/");
      return ig.ignores(rel);
    };
  }

  keys(): Iterable<string> {
    return [...this.inner.keys()].filter((key) =>
      this.inner.getByKey(key).some((c) => !this.isIgnored(c.path)),
    );
  }

  getByKey(key: string) {
    return this.inner.getByKey(key).filter((c) => !this.isIgnored(c.path));
  }
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

  private collectorOptionsKey(options: Record<string, unknown>): string {
    const { ignores: _, ...rest } = options;
    return JSON.stringify(rest);
  }

  private buildCollectorEntries(): CollectorEntry[] {
    const seen = new Set<string>();
    const entries: CollectorEntry[] = [];
    for (const rule of this.config.rules) {
      const options = this.ruleOptions.get(rule.id)!;
      const optionsStr = this.collectorOptionsKey(options);
      for (const collector of rule.collectors) {
        const key = `${collector.id}:${optionsStr}`;
        if (!seen.has(key)) {
          seen.add(key);
          const { ignores: _, ...collectorOptions } = options;
          entries.push({ collector, options: collectorOptions, key });
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

  private async collectFromFile(filePath: string) {
    const language = this.languages.find((lang) => lang.match(filePath));
    if (!language) {
      console.error(`No language found for ${filePath}`);
      return;
    }
    const code = await readFile(filePath, "utf-8");
    const program = await language.parse(code, filePath);

    for (const { collector, options, key } of this.collectorEntries) {
      const collectContext = this.collectContexts.get(key)!;
      const collectContextAPI = collectContext.mutationApi(filePath, code);
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
    const optionsStr = this.collectorOptionsKey(options);
    const ignorePatterns = options.ignores as string[] | undefined;

    const resolveContext = (collector: Collector): CollectorQueryAPI => {
      const ctx = this.collectContexts.get(`${collector.id}:${optionsStr}`)!;
      return ignorePatterns?.length
        ? new FilteredCollectorContext(ctx, ignorePatterns)
        : ctx;
    };

    rule.check(context, rule.collectors.map(resolveContext), options);
  }
}
