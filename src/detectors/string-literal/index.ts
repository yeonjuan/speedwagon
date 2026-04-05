import type { Detector } from "../../types/index.js";
import {
  stringLiteralCollector,
  type StringLiteralDetectorConfig,
} from "./collector.js";
import { createAnalyzer } from "./analyzer.js";

export function createStringLiteralDetector(
  config: StringLiteralDetectorConfig = {},
): Detector {
  return {
    name: "string-literal",
    description: "Detects duplicated string literals",
    createCollector: stringLiteralCollector(config),
    analyze: createAnalyzer(config),
  };
}
