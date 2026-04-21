import { parse as oxcParse, type Program } from "oxc-parser";
import type { Language } from "../types.js";
import { createParseError } from "../helpers.js";

function match(filePath: string): boolean {
  return (
    filePath.endsWith(".js") ||
    filePath.endsWith(".mjs") ||
    filePath.endsWith(".cjs")
  );
}

async function parse(sourceCode: string, filePath: string): Promise<Program> {
  const result = await oxcParse(filePath, sourceCode, { lang: "js" });

  if (result.errors.length > 0) {
    throw createParseError(result.errors[0].message);
  }

  return result.program;
}

export const jsLanguage: Language = {
  extensions: [".js", ".mjs", ".cjs"],
  match,
  parse,
};
