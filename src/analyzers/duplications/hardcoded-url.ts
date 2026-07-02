import type { CollectedItem, DuplicationsAnalyzer } from "./types.js";

const URL_RE = /^https?:\/\/\S+$/;

function normalizeLanguageId(languageId: string): string {
  if (languageId === ".ts" || languageId === ".tsx") return "ts(x)";
  if (languageId === ".js" || languageId === ".jsx") return "js(x)";
  return languageId;
}

export const hardcodedUrl: DuplicationsAnalyzer = {
  visitor(context) {
    return {
      Literal(node: { value: unknown; start: number }) {
        if (typeof node.value !== "string") return;
        const url = node.value;
        if (!URL_RE.test(url)) return;
        context.collect({ key: url, display: url, offset: node.start });
      },
      JSXText(node: { value: string; start: number }) {
        const url = node.value.trim();
        if (!URL_RE.test(url)) return;
        context.collect({ key: url, display: url, offset: node.start });
      },
    };
  },
  analyze(context) {
    const groups = new Map<string, Map<string, CollectedItem>>();

    for (const item of context.items) {
      const langFamily = normalizeLanguageId(item.languageId);
      const groupKey = `${item.scope}:::${langFamily}:::${item.key}`;
      if (!groups.has(groupKey)) groups.set(groupKey, new Map());
      const byFile = groups.get(groupKey)!;
      if (!byFile.has(item.filePath)) byFile.set(item.filePath, item);
    }

    for (const byFile of groups.values()) {
      if (byFile.size < 2) continue;
      const items = [...byFile.values()];
      context.report({
        message: `Duplicate hardcoded URL \`${items[0].display}\``,
        locations: items.map((item) => ({
          filePath: item.filePath,
          line: item.line,
          column: item.column,
        })),
      });
    }
  },
};
