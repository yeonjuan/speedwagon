import { parseSync } from "oxc-parser";
import { readFileSync } from "fs";
import type { Detector, GlobalContext, Report } from "../types/index.js";
import type { Reporter } from "../reporters/types.js";
import { Context } from "./context.js";
import { StdoutReporter } from "../reporters/stdout-reporter.js";

export interface RunnerConfig {
  files: string[];
  detectors: Detector[];
  reporter?: Reporter;
  verbose?: boolean;
}

export class Runner {
  private context: GlobalContext;
  private config: RunnerConfig;
  private reporter: Reporter;

  constructor(config: RunnerConfig) {
    this.context = new Context();
    this.config = config;
    this.reporter = config.reporter ?? new StdoutReporter();
  }

  async run(): Promise<Report[]> {
    const startTime = Date.now();

    this.log("Starting Two-Phase Analysis...");
    this.log(`Files to analyze: ${this.config.files.length}`);
    this.log(
      `Detectors: ${this.config.detectors.map((d) => d.name).join(", ")}`,
    );

    this.runPhase1();
    const reports = await this.runPhase2();

    const duration = Date.now() - startTime;
    this.log(`Analysis completed in ${duration}ms`);
    this.log(`Total reports: ${reports.length}`);

    await this.reporter.report(reports);

    return reports;
  }

  private runPhase1(): void {
    this.log("\n=== Phase 1: Collection ===");
    const startTime = Date.now();

    for (const filePath of this.config.files) {
      this.collectFromFile(filePath);
    }

    const duration = Date.now() - startTime;
    this.log(`Collection completed in ${duration}ms`);
    this.log(`Metadata entries: ${this.context.size()}`);
  }

  private collectFromFile(filePath: string): void {
    try {
      this.log(`Collecting: ${filePath}`);

      const sourceCode = readFileSync(filePath, "utf-8");

      const parseResult = parseSync(filePath, sourceCode, {
        lang: this.inferLanguage(filePath),
      });

      if (parseResult.errors.length > 0) {
        console.error(`Parse errors in ${filePath}:`);
        parseResult.errors.forEach((err) => {
          console.error(`  ${err.message}`);
        });
        return;
      }

      const program = parseResult.program;

      for (const detector of this.config.detectors) {
        this.log(`  Creating collector for ${detector.name}`);
        const collector = detector.createCollector(
          this.context,
          filePath,
          sourceCode,
        );

        collector.onStart?.();
        this.log(`  Visiting AST for ${filePath}`);
        collector.visit(program);
        collector.onEnd?.();
        this.log(
          `  Finished collecting from ${filePath} with ${detector.name}`,
        );
      }
    } catch (error) {
      console.error(`Error collecting from ${filePath}:`, error);
    }
  }

  private async runPhase2(): Promise<Report[]> {
    this.log("\n=== Phase 2: Analysis ===");
    const startTime = Date.now();

    const allReports: Report[] = [];

    for (const detector of this.config.detectors) {
      try {
        this.log(`Analyzing: ${detector.name}`);
        const reports = await detector.analyze(this.context);
        allReports.push(...reports);
        this.log(`  Found ${reports.length} duplicates`);
      } catch (error) {
        console.error(`Error analyzing with ${detector.name}:`, error);
      }
    }

    const duration = Date.now() - startTime;
    this.log(`Analysis completed in ${duration}ms`);

    return allReports;
  }

  private inferLanguage(filePath: string): "js" | "jsx" | "ts" | "tsx" {
    if (filePath.endsWith(".tsx")) return "tsx";
    if (filePath.endsWith(".ts")) return "ts";
    if (filePath.endsWith(".jsx")) return "jsx";
    return "js";
  }

  private log(message: string): void {
    if (this.config.verbose) {
      console.log(message);
    }
  }

  dispose(): void {}

  getContext(): GlobalContext {
    return this.context;
  }
}
