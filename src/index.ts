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

export { MagicNumberDetector } from "./detectors/magic-number/index.js";
export { UnionTypeDetector } from "./detectors/union-type/index.js";
