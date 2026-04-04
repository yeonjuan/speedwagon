import type {
  Detector,
  GlobalContext,
  Report,
  DetectorConfig,
} from "../../types/index.js";
import { UnionTypeCollector } from "./collector.js";
import { UnionTypeAnalyzer } from "./analyzer.js";

export interface UnionTypeDetectorConfig extends DetectorConfig {
  minOccurrences?: number;
}

export class UnionTypeDetector implements Detector {
  name = "union-type";
  description = "Detects duplicate union types";
  config?: UnionTypeDetectorConfig;
  private minOccurrences: number;

  constructor(config?: UnionTypeDetectorConfig) {
    this.config = config;
    this.minOccurrences = config?.minOccurrences ?? 2;
  }

  createCollector(
    context: GlobalContext,
    filePath: string,
    sourceCode: string,
  ) {
    return new UnionTypeCollector(context, filePath, sourceCode);
  }

  async analyze(context: GlobalContext): Promise<Report[]> {
    const analyzer = new UnionTypeAnalyzer(this.minOccurrences);
    return analyzer.analyze(context);
  }
}

export { UnionTypeCollector } from "./collector.js";
export { UnionTypeAnalyzer } from "./analyzer.js";
export type { UnionTypeInfo, UnionTypeGroup } from "./types.js";
