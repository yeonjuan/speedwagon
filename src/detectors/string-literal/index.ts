import type { Detector, DetectorConfig } from "../../types/index.js";
import { stringLiteralCollector } from "./collector.js";
import { createAnalyzer } from "./analyzer.js";

export interface StringLiteralDetectorConfig extends DetectorConfig {
  minOccurrences?: number;
}

export function createStringLiteralDetector(
  config?: StringLiteralDetectorConfig,
): Detector {
  const minOccurrences = config?.minOccurrences ?? 3;

  return {
    name: "string-literal",
    description:
      "Detects duplicate string literals in variable declarations and expressions",
    createCollector: stringLiteralCollector,
    analyze: createAnalyzer(minOccurrences),
    config,
  };
}
