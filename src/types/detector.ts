import type { CollectorFactory } from "./collector.js";
import type { DetectorContext, ReportContext } from "./context.js";

export interface Detector {
  readonly name: string;
  readonly description: string;
  createCollector: CollectorFactory;
  analyze(
    collectContext: DetectorContext,
    reportContext: ReportContext,
  ): Promise<void>;
  config?: DetectorConfig;
}

export interface DetectorConfig {
  minSize?: number;
  options?: Record<string, unknown>;
}
