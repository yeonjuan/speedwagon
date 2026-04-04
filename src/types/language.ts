import type { Program } from "oxc-parser";

export interface Language {
  match(filePath: string): boolean;
  parse(sourceCode: string, filePath: string): Promise<Program>;
}
