import type { Root } from "postcss";
import type { Program } from "oxc-parser";

export interface ReportLocation {
  filePath: string;
  line: number;
  column: number;
}

export interface ReportItem {
  message: string;
  location: ReportLocation;
}

export interface DefinedClass {
  name: string;
  cssFilePath: string;
  line: number;
  column: number;
}

export interface UsedClass {
  cssFilePath: string;
  name: string;
}

export interface AnalyzeContext {
  definedClasses: DefinedClass[];
  usedClasses: UsedClass[];
  report(item: ReportItem): void;
}

export interface UnusedAnalyzer {
  cssModuleExtensions: string[];
  extractClasses(filePath: string, root: Root): DefinedClass[];
  collectUsages(jsFilePath: string, program: Program): UsedClass[];
  analyze(context: AnalyzeContext): void;
}
