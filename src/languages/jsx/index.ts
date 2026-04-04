import { parse as oxcParse, type Program } from "oxc-parser";
import type { Language } from "../../types/index.js";

function match(filePath: string): boolean {
  return filePath.endsWith(".jsx");
}

async function parse(sourceCode: string, filePath: string): Promise<Program> {
  const result = await oxcParse(filePath, sourceCode, { lang: "jsx" });

  if (result.errors.length > 0) {
    throw new Error(`Parse error: ${result.errors[0].message}`);
  }

  return result.program;
}

export const jsxLanguage: Language = {
  match,
  parse,
};
