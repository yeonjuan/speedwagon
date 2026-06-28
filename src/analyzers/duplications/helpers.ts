import type { AnalyzeContext, CollectedItem } from "./types.js";

export function analyzeCrossFileDuplicates(
  context: AnalyzeContext,
  makeMessage: (display: string) => string,
): void {
  const groups = new Map<string, Map<string, CollectedItem>>();

  for (const item of context.items) {
    const groupKey = `${item.scope}:::${item.languageId}:::${item.key}`;
    if (!groups.has(groupKey)) groups.set(groupKey, new Map());
    const byFile = groups.get(groupKey)!;
    if (!byFile.has(item.filePath)) byFile.set(item.filePath, item);
  }

  for (const byFile of groups.values()) {
    if (byFile.size < 2) continue;
    const items = [...byFile.values()];
    context.report({
      message: makeMessage(items[0].display),
      locations: items.map((item) => ({
        filePath: item.filePath,
        line: item.line,
        column: item.column,
      })),
    });
  }
}
