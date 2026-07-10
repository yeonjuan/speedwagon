import { parse as scssParse } from "postcss-scss";
import type { CssLanguage } from "./types.js";

export const scssModuleLanguage: CssLanguage = {
  extensions: [".module.scss"],
  match: (filePath) => filePath.endsWith(".module.scss"),
  parse: (sourceCode) => scssParse(sourceCode),
};
