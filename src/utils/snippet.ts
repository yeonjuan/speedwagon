import type { Location } from "../types/index.js";

export function extractSnippet(
  sourceCode: string,
  location: Location,
  options?: { expandLines?: number; useRaw?: boolean },
): string {
  try {
    if (options?.useRaw) {
      const lines = sourceCode.split("\n");
      const startLineIndex = location.start.line - 1;
      const endLineIndex = location.end.line - 1;

      if (startLineIndex === endLineIndex) {
        return lines[startLineIndex].substring(
          location.start.column,
          location.end.column,
        );
      }

      const firstLine = lines[startLineIndex].substring(location.start.column);
      const middleLines = lines.slice(startLineIndex + 1, endLineIndex);
      const lastLine = lines[endLineIndex].substring(0, location.end.column);

      return [firstLine, ...middleLines, lastLine].join("\n");
    }
    const lines = sourceCode.split("\n");
    const startLineIndex = location.start.line - 1;
    const endLineIndex = location.end.line - 1;

    let startLine = startLineIndex;
    let endLine = endLineIndex + 1;

    const expand = options?.expandLines ?? 0;
    if (expand > 0) {
      startLine = Math.max(0, startLineIndex - Math.floor(expand / 2));
      endLine = Math.min(
        lines.length,
        endLineIndex + 1 + Math.ceil(expand / 2),
      );
    }

    return lines.slice(startLine, endLine).join("\n").trim();
  } catch (error) {
    return "// Unable to extract snippet";
  }
}
