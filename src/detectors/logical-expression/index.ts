import type { Detector, DetectorConfig } from "../../types/index.js";
import { logicalExpressionCollector } from "./collector.js";
import { createAnalyzer } from "./analyzer.js";

export interface LogicalExpressionDetectorConfig extends DetectorConfig {
  minOccurrences?: number;
  minOperands?: number;
}

export function createLogicalExpressionDetector(
  config: LogicalExpressionDetectorConfig = {},
): Detector {
  return {
    name: "logical-expression",
    description:
      "Detects structurally identical logical expressions to encourage extraction",
    createCollector: logicalExpressionCollector(config),
    analyze: createAnalyzer(config),
  };
}
