import postcss from "postcss";
import type { CssLanguage } from "./types.js";

export const cssModuleLanguage: CssLanguage = {
  extensions: [".module.css"],
  match: (filePath) => filePath.endsWith(".module.css"),
  parse: (sourceCode) => postcss.parse(sourceCode),
};
