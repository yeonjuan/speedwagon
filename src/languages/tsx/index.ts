import { parse as oxcParse, type Program } from "oxc-parser";
import type { Language } from "../../types/index.js";
import { createParseError } from "../../utils/index.js";

function match(filePath: string): boolean {
  return filePath.endsWith(".tsx");
}

async function parse(sourceCode: string, filePath: string): Promise<Program> {
  const result = await oxcParse(filePath, sourceCode, { lang: "tsx" });

  if (result.errors.length > 0) {
    throw createParseError(result.errors[0].message);
  }

  return result.program;
}

export const tsxLanguage: Language = {
  match,
  parse,
};
