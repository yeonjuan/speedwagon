import type { VisitorObject } from "oxc-parser";

export interface CollectedItem {
  key: string;
  display: string;
  filePath: string;
  languageId: string;
  line: number;
  column: number;
}

export interface VisitorContext {
  filePath: string;
  languageId: string;
  collect(item: { key: string; display: string; offset: number }): void;
}

export interface ReportLocation {
  filePath: string;
  line: number;
  column: number;
}

export interface ReportItem {
  message: string;
  locations: ReportLocation[];
}

export interface AnalyzeContext {
  items: CollectedItem[];
  report(item: ReportItem): void;
}

export interface DuplicationsAnalyzer {
  visitor(context: VisitorContext): VisitorObject;
  analyze(context: AnalyzeContext): void;
}
