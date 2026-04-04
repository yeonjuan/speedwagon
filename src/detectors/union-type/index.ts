import type { Detector, DetectorConfig } from "../../types/index.js";
import { unionTypeCollector } from "./collector.js";
import { createAnalyzer } from "./analyzer.js";

export interface UnionTypeDetectorConfig extends DetectorConfig {
  minOccurrences?: number;
}

export function createUnionTypeDetector(
  config?: UnionTypeDetectorConfig,
): Detector {
  const minOccurrences = config?.minOccurrences ?? 2;

  return {
    name: "union-type",
    description: "Detects duplicate union types",
    config,
    createCollector: unionTypeCollector,
    analyze: createAnalyzer(minOccurrences),
  };
}

export { unionTypeCollector } from "./collector.js";
export { createAnalyzer } from "./analyzer.js";
export type { UnionTypeInfo, UnionTypeGroup } from "./types.js";
