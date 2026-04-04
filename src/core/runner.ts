import { readFile } from "fs/promises";
import type {
  Detector,
  GlobalContext,
  ReportContext,
  Report,
  Language,
} from "../types/index.js";
import type { Reporter } from "../reporters/types.js";
import { Context } from "./context.js";
import { StdoutReporter } from "../reporters/stdout-reporter.js";
import { jsLanguage } from "../languages/js/index.js";
import { tsLanguage } from "../languages/ts/index.js";
import { jsxLanguage } from "../languages/jsx/index.js";
import { tsxLanguage } from "../languages/tsx/index.js";

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
  private languages: Language[];
  private collectContexts: Map<string, any>;

  constructor(config: RunnerConfig) {
    this.context = new Context();
    this.config = config;
    this.reporter = config.reporter ?? new StdoutReporter();
    this.languages = [tsxLanguage, tsLanguage, jsxLanguage, jsLanguage];
    this.collectContexts = new Map();

    for (const detector of config.detectors) {
      this.collectContexts.set(
        detector.name,
        this.context.createDetectorContext(detector.name),
      );
    }
  }

  async run(): Promise<Report[]> {
    const startTime = Date.now();

    this.log("Starting Two-Phase Analysis...");
    this.log(`Files to analyze: ${this.config.files.length}`);
    this.log(
      `Detectors: ${this.config.detectors.map((d) => d.name).join(", ")}`,
    );

    await this.collectMetadata();
    const reportContext = await this.analyzeAndReport();
    const reports = reportContext.getReports();

    const duration = Date.now() - startTime;
    this.log(`Analysis completed in ${duration}ms`);
    this.log(`Total reports: ${reports.length}`);

    await this.reporter.report(reports);

    return reports;
  }

  private async collectMetadata(): Promise<void> {
    this.log("\n=== Collecting Metadata ===");
    const startTime = Date.now();

    for (const filePath of this.config.files) {
      await this.collectFromFile(filePath);
    }

    const duration = Date.now() - startTime;
    this.log(`Collection completed in ${duration}ms`);
    this.log(`Metadata entries: ${this.context.size()}`);
  }

  private async collectFromFile(filePath: string): Promise<void> {
    try {
      this.log(`Collecting: ${filePath}`);

      const sourceCode = await readFile(filePath, "utf-8");

      const language = this.languages.find((lang) => lang.match(filePath));
      if (!language) {
        console.error(`No language found for ${filePath}`);
        return;
      }

      const program = await language.parse(sourceCode, filePath);

      for (const detector of this.config.detectors) {
        this.log(`  Creating collector for ${detector.name}`);
        const collectContext = this.collectContexts.get(detector.name)!;
        const collector = detector.createCollector(
          collectContext,
          filePath,
          sourceCode,
        );

        this.log(`  Visiting AST for ${filePath}`);
        const visitor = collector.visitor();
        visitor.visit(program);
        this.log(
          `  Finished collecting from ${filePath} with ${detector.name}`,
        );
      }
    } catch (error) {
      console.error(`Error collecting from ${filePath}:`, error);
    }
  }

  private async analyzeAndReport(): Promise<ReportContext> {
    this.log("\n=== Analyzing Duplicates ===");
    const startTime = Date.now();

    const reportContext = this.context.createReportContext();

    for (const detector of this.config.detectors) {
      try {
        this.log(`Analyzing: ${detector.name}`);
        const collectContext = this.collectContexts.get(detector.name)!;

        await detector.analyze(collectContext, reportContext);

        const currentReports = reportContext.getReports();
        this.log(`  Found ${currentReports.length} duplicates`);

        collectContext.clear();
        this.log(`  Cleared collect context for ${detector.name}`);
      } catch (error) {
        console.error(`Error analyzing with ${detector.name}:`, error);
      }
    }

    const duration = Date.now() - startTime;
    this.log(`Analysis completed in ${duration}ms`);

    return reportContext;
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
