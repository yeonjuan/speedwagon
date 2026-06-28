import type { VisitorObject } from "oxc-parser";

export interface ReportLocation {
  filePath: string;
  line: number;
  column: number;
}

export interface ReportItem {
  message: string;
  location: ReportLocation;
}

export interface VisitorContext {
  filePath: string;
  languageId: string;
  report(item: { message: string; offset: number }): void;
}

export interface UselessAnalyzer {
  visitor(context: VisitorContext): VisitorObject;
}
