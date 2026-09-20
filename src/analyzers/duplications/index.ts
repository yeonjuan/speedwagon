export { runDuplicationsAnalyzers } from "./runner.js";

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
