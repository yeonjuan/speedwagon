import type { Location } from "../types/index.js";

const CONTEXT_LINES = 2;

export interface SnippetLine {
  lineNumber: number;
  content: string;
  highlighted: boolean;
}

export function getSnippet(code: string, location: Location): SnippetLine[] {
  const lines = code.split("\n");
  const startLine = Math.max(0, location.start.line - 1 - CONTEXT_LINES);
  const endLine = Math.min(
    lines.length - 1,
    location.end.line - 1 + CONTEXT_LINES,
  );
  return lines.slice(startLine, endLine + 1).map((content, i) => {
    const lineNumber = startLine + i + 1;
    return {
      lineNumber,
      content,
      highlighted:
        lineNumber >= location.start.line && lineNumber <= location.end.line,
    };
  });
}
