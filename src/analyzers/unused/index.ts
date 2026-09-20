export { runUnusedAnalyzers } from "./runner.js";

import { unusedClasses } from "./classes.js";
import type { UnusedAnalyzer } from "./types.js";

export const analyzers: UnusedAnalyzer[] = [unusedClasses];
