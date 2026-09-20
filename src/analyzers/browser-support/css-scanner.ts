import postcss, { type Root, type Syntax } from "postcss";
import postcssScss from "postcss-scss";
import type { FoundFeature } from "./types.js";

const SCSS_AT_RULES = new Set([
  "use",
  "forward",
  "mixin",
  "include",
  "function",
  "return",
  "if",
  "else",
  "each",
  "for",
  "while",
  "extend",
  "content",
  "at-root",
  "debug",
  "warn",
  "error",
]);

export function collectCssFeatures(
  source: string,
  filePath: string,
  isScss: boolean,
): FoundFeature[] {
  const syntax: Syntax | undefined = isScss
    ? (postcssScss as unknown as Syntax)
    : undefined;
  const root: Root = postcss.parse(source, {
    from: filePath,
    ...(syntax ? { syntax } : {}),
  });

  const seen = new Set<string>();
  const result: FoundFeature[] = [];
  const push = (feature: FoundFeature) => {
    const key = `${feature.kind}:${feature.name}:${feature.value ?? ""}:${feature.line}`;
    if (seen.has(key)) return;
    seen.add(key);
    result.push(feature);
  };

  root.walkDecls((decl) => {
    const prop = decl.prop.trim().toLowerCase();
    if (!prop || prop.startsWith("--") || prop.startsWith("$")) return;

    const line = decl.source?.start?.line ?? 0;
    const column = decl.source?.start?.column ?? 0;
    const value = decl.value.trim();

    push({
      kind: "css-property",
      filePath,
      line,
      column,
      object: null,
      name: prop,
    });
    if (value && !value.includes("#{") && !value.startsWith("$")) {
      push({
        kind: "css-value",
        filePath,
        line,
        column,
        object: null,
        name: prop,
        value,
      });
    }
  });

  root.walkAtRules((atRule) => {
    const name = atRule.name.trim().toLowerCase();
    if (!name || (isScss && SCSS_AT_RULES.has(name))) return;
    push({
      kind: "css-at-rule",
      filePath,
      line: atRule.source?.start?.line ?? 0,
      column: atRule.source?.start?.column ?? 0,
      object: null,
      name,
    });
  });

  return result;
}
