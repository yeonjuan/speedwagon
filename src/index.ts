export { Context } from "./core/context.js";
export { Runner } from "./core/runner.js";
export type { RunnerConfig } from "./core/runner.js";

export type {
  GlobalContext,
  Store,
  Position,
  Location,
  Collector,
  CollectorFactory,
  Detector,
  DetectorConfig,
  Report,
  DuplicateEntry,
} from "./types/index.js";

export { StdoutReporter } from "./reporters/stdout-reporter.js";
export type { Reporter } from "./reporters/types.js";

export { createUnionTypeDetector } from "./detectors/union-type/index.js";
export { createStringLiteralDetector } from "./detectors/string-literal/index.js";
export { createLogicalExpressionDetector } from "./detectors/logical-expression/index.js";
