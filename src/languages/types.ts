import type { Program } from "oxc-parser";
import type { Root } from "postcss";

export interface Language {
  extensions: string[];
  match(filePath: string): boolean;
  parse(sourceCode: string, filePath: string): Promise<Program>;
}

export interface CssLanguage {
  extensions: string[];
  match(filePath: string): boolean;
  parse(sourceCode: string): Root;
}
