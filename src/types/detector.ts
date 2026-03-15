import type { CollectorFactory } from "./collector.js";
import type { GlobalContext } from "./context.js";
import type { Report } from "./report.js";

export interface Detector {
  readonly name: string;
  readonly description: string;
  createCollector: CollectorFactory;
  analyze(context: GlobalContext): Promise<Report[]>;
  config?: DetectorConfig;
}

export interface DetectorConfig {
  minSimilarity?: number;
  minSize?: number;
  options?: Record<string, unknown>;
}
