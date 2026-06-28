export { classNameSpace } from "./class-name-space.js";
export { runUselessAnalyzers } from "./runner.js";
export type { UselessAnalyzer, ReportItem } from "./types.js";

import { classNameSpace } from "./class-name-space.js";
import type { UselessAnalyzer } from "./types.js";

export const analyzers: UselessAnalyzer[] = [classNameSpace];
