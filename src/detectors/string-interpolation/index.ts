import type { Detector, DetectorConfig } from "../../types/index.js";
import { stringInterpolationCollector } from "./collector.js";
import { createAnalyzer } from "./analyzer.js";

export interface StringInterpolationDetectorConfig extends DetectorConfig {
  minOccurrences?: number;
}

export function createStringInterpolationDetector(
  config: StringInterpolationDetectorConfig = {},
): Detector {
  return {
    name: "string-interpolation",
    description:
      "Detects structurally identical string interpolations formatting patterns.",
    createCollector: stringInterpolationCollector(config),
    analyze: createAnalyzer(config),
  };
}
