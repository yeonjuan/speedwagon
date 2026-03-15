import { Module } from '@swc/core';

export interface FileInfo {
  path: string;
  language: Language;
  ast: Module;
}

export type Language = 'javascript' | 'typescript' | 'jsx' | 'tsx';

export interface LanguageStats {
  language: Language;
  count: number;
  percentage: number;
}

export interface DuplicateCode {
  code: string;
  locations: CodeLocation[];
}

export interface CodeLocation {
  filePath: string;
  startLine: number;
  endLine: number;
}

export interface UnusedCode {
  name: string;
  type: 'function' | 'class' | 'variable' | 'type';
  location: CodeLocation;
}

export interface ExportInfo {
  name: string;
  type: 'function' | 'class' | 'variable' | 'type';
  location: CodeLocation;
}

export interface ImportInfo {
  name: string;
  source: string;
  location: CodeLocation;
}

export interface AnalysisResult {
  languageStats: LanguageStats[];
  duplicateCodes: DuplicateCode[];
  unusedCodes: UnusedCode[];
}

export interface ReporterOptions {
  format: 'json' | 'html';
  outputPath: string;
}
