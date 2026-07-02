export { regex } from "./regex.js";
export { typeDeclaration } from "./type-declaration.js";
export { enumDeclaration } from "./enum-declaration.js";
export { jsxSvg } from "./jsx-svg.js";
export { className } from "./class-name.js";
export { hardcodedUrl } from "./hardcoded-url.js";
export { runDuplicationsAnalyzers } from "./runner.js";
export type { DuplicationsAnalyzer, ReportItem } from "./types.js";

import { regex } from "./regex.js";
import { typeDeclaration } from "./type-declaration.js";
import { enumDeclaration } from "./enum-declaration.js";
import { jsxSvg } from "./jsx-svg.js";
import { className } from "./class-name.js";
import { hardcodedUrl } from "./hardcoded-url.js";
import type { DuplicationsAnalyzer } from "./types.js";

export const analyzers: DuplicationsAnalyzer[] = [
  regex,
  typeDeclaration,
  enumDeclaration,
  jsxSvg,
  className,
  hardcodedUrl,
];
