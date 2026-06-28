import type { DuplicationsAnalyzer } from "./types.js";

export const className: DuplicationsAnalyzer = {
  visitor(context) {
    return {
      JSXAttribute(node) {
        if (node.name.type !== "JSXIdentifier") return;
        const attrName = node.name.name;
        if (attrName !== "className" && attrName !== "class") return;
        if (!node.value || node.value.type !== "Literal") return;
        if (typeof node.value.value !== "string") return;

        const classes = node.value.value.split(/\s+/).filter(Boolean);
        const seen = new Set<string>();
        const duplicates = new Set<string>();
        for (const cls of classes) {
          if (seen.has(cls)) duplicates.add(cls);
          seen.add(cls);
        }
        if (duplicates.size === 0) return;

        const dupList = [...duplicates].join(", ");
        context.collect({
          key: `${context.filePath}:${node.start}`,
          display: `"${node.value.value}" (duplicate: ${dupList})`,
          offset: node.start,
        });
      },
    };
  },
  analyze(context) {
    for (const item of context.items) {
      context.report({
        message: `Duplicate class names in ${item.display}`,
        locations: [
          { filePath: item.filePath, line: item.line, column: item.column },
        ],
      });
    }
  },
};
