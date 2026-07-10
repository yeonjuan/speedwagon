export { unusedClasses } from "./classes.js";
export { runUnusedAnalyzers } from "./runner.js";
export type { UnusedAnalyzer, ReportItem } from "./types.js";

import { unusedClasses } from "./classes.js";
import type { UnusedAnalyzer } from "./types.js";

export const analyzers: UnusedAnalyzer[] = [unusedClasses];
