import { readFile } from "fs/promises";
import type {
  Collector,
  GlobalContext,
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
import { ENCODING_UTF8 } from "../constants/index.js";

export interface RunnerConfig {
  files: string[];
  collectors: Collector[];
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

    for (const collector of config.collectors) {
      this.collectContexts.set(
        collector.name,
        this.context.createCollectorContext(collector.name),
      );
    }
  }

  async run(): Promise<Report[]> {
    const startTime = Date.now();

    this.log("Starting Analysis...");
    this.log(`Files to analyze: ${this.config.files.length}`);
    this.log(
      `Collectors: ${this.config.collectors.map((d) => d.name).join(", ")}`,
    );

    await this.collectMetadata();
    const reports = await this.analyzeAndReport();

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

      const sourceCode = await readFile(filePath, ENCODING_UTF8);

      const language = this.languages.find((lang) => lang.match(filePath));
      if (!language) {
        console.error(`No language found for ${filePath}`);
        return;
      }

      const program = await language.parse(sourceCode, filePath);

      for (const collector of this.config.collectors) {
        this.log(`  Creating visitor for ${collector.name}`);
        const collectContext = this.collectContexts.get(collector.name)!;
        const visitorObj = collector.createVisitor(
          collectContext,
          filePath,
          sourceCode,
        );

        this.log(`  Visiting AST for ${filePath}`);
        const visitor = visitorObj.visitor();
        visitor.visit(program);
        this.log(
          `  Finished collecting from ${filePath} with ${collector.name}`,
        );
      }
    } catch (error) {
      console.error(`Error collecting from ${filePath}:`, error);
    }
  }

  private async analyzeAndReport(): Promise<Report[]> {
    this.log("\n=== Generating Duplicate Reports ===");
    const startTime = Date.now();

    const globalReports: Report[] = [];

    for (const collector of this.config.collectors) {
      try {
        this.log(`Reporting for: ${collector.name}`);
        const collectContext = this.collectContexts.get(collector.name)!;

        // Using the single Collector object interface
        const currentReports = collector.report(collectContext);
        
        globalReports.push(...currentReports);
        this.log(`  Found ${currentReports.length} duplicates`);

        collectContext.clear();
        this.log(`  Cleared collect context for ${collector.name}`);
      } catch (error) {
        console.error(`Error generating report for ${collector.name}:`, error);
      }
    }

    const duration = Date.now() - startTime;
    this.log(`Analysis generation completed in ${duration}ms`);

    return globalReports;
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
