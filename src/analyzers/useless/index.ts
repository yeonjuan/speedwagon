export { runUselessAnalyzers } from "./runner.js";

import { classNameSpace } from "./class-name-space.js";
import type { UselessAnalyzer } from "./types.js";

export const analyzers: UselessAnalyzer[] = [classNameSpace];
