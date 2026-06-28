import type { UselessAnalyzer } from "./types.js";

function hasUnnecessarySpaces(value: string): boolean {
  return value.startsWith(" ") || value.endsWith(" ") || / {2,}/.test(value);
}

export const classNameSpace: UselessAnalyzer = {
  visitor(context) {
    return {
      JSXAttribute(node) {
        if (node.name.type !== "JSXIdentifier") return;
        const attrName = node.name.name;
        if (attrName !== "className" && attrName !== "class") return;
        if (!node.value || node.value.type !== "Literal") return;
        if (typeof node.value.value !== "string") return;
        if (!hasUnnecessarySpaces(node.value.value)) return;

        context.report({
          message: `Unnecessary whitespace in \`${attrName}\``,
          offset: node.start,
        });
      },
    };
  },
};
