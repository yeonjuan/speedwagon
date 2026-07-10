import path from "node:path";
import { walk } from "oxc-walker";
import selectorParser from "postcss-selector-parser";
import type { Root } from "postcss";
import type {
  Program,
  ImportDeclaration,
  ComputedMemberExpression,
  StaticMemberExpression,
} from "oxc-parser";
import type {
  UnusedAnalyzer,
  DefinedClass,
  UsedClass,
  AnalyzeContext,
} from "./types.js";

const CSS_MODULE_EXTENSIONS = [".module.css", ".module.scss"];

function lineColumnToOffset(
  source: string,
  line: number,
  column: number,
): number {
  let offset = 0;
  for (let currentLine = 1; currentLine < line; currentLine++) {
    const nextNewline = source.indexOf("\n", offset);
    if (nextNewline === -1) break;
    offset = nextNewline + 1;
  }
  return offset + (column - 1);
}

function getLineColumn(
  source: string,
  offset: number,
): { line: number; column: number } {
  const lines = source.slice(0, offset).split("\n");
  return { line: lines.length, column: lines[lines.length - 1].length };
}

function isInsideGlobal(node: selectorParser.Node): boolean {
  let current: selectorParser.Container | undefined = node.parent;
  while (current) {
    if (current.type === "pseudo" && current.value === ":global") return true;
    current = current.parent;
  }
  return false;
}

function extractClasses(filePath: string, root: Root): DefinedClass[] {
  const source = root.source?.input.css ?? "";
  const result: DefinedClass[] = [];
  const seen = new Set<string>();

  root.walkRules((rule) => {
    if (!rule.source?.start) return;

    const ruleOffset = lineColumnToOffset(
      source,
      rule.source.start.line,
      rule.source.start.column,
    );

    selectorParser((selectors) => {
      selectors.walkClasses((classNode) => {
        if (isInsideGlobal(classNode)) return;

        const name = classNode.value;
        if (seen.has(name)) return;
        seen.add(name);

        const absOffset = ruleOffset + classNode.sourceIndex;
        const { line, column } = getLineColumn(source, absOffset);
        result.push({ name, cssFilePath: filePath, line, column });
      });
    }).processSync(rule.selector);
  });

  return result;
}

function collectUsages(jsFilePath: string, program: Program): UsedClass[] {
  const usages: UsedClass[] = [];
  const cssModuleBindings = new Map<string, string>();

  walk(program, {
    enter(node) {
      if (node.type === "ImportDeclaration") {
        const decl = node as unknown as ImportDeclaration;
        const source = decl.source.value;
        if (
          !CSS_MODULE_EXTENSIONS.some((ext) => (source as string).endsWith(ext))
        )
          return;

        const absPath = path.resolve(path.dirname(jsFilePath), source);
        for (const spec of decl.specifiers) {
          if (
            spec.type === "ImportDefaultSpecifier" ||
            spec.type === "ImportNamespaceSpecifier"
          ) {
            cssModuleBindings.set(spec.local.name, absPath);
          }
        }
        return;
      }

      if (node.type === "MemberExpression") {
        const expr = node as unknown as
          | StaticMemberExpression
          | ComputedMemberExpression;
        if (expr.object.type !== "Identifier") return;
        const cssFilePath = cssModuleBindings.get(
          (expr.object as { name: string }).name,
        );
        if (!cssFilePath) return;

        if (!expr.computed) {
          const staticExpr = expr as StaticMemberExpression;
          usages.push({ cssFilePath, name: staticExpr.property.name });
        } else {
          const computedExpr = expr as ComputedMemberExpression;
          const prop = computedExpr.property as {
            type: string;
            value: unknown;
          };
          if (prop.type === "Literal" && typeof prop.value === "string") {
            usages.push({ cssFilePath, name: prop.value });
          }
        }
      }
    },
  });

  return usages;
}

function analyze(context: AnalyzeContext): void {
  const usedSet = new Set(
    context.usedClasses.map((u) => `${u.cssFilePath}:::${u.name}`),
  );

  for (const cls of context.definedClasses) {
    if (!usedSet.has(`${cls.cssFilePath}:::${cls.name}`)) {
      context.report({
        message: `Unused CSS class \`.${cls.name}\` in ${path.basename(cls.cssFilePath)}`,
        location: {
          filePath: cls.cssFilePath,
          line: cls.line,
          column: cls.column,
        },
      });
    }
  }
}

export const unusedClasses: UnusedAnalyzer = {
  cssModuleExtensions: CSS_MODULE_EXTENSIONS,
  extractClasses,
  collectUsages,
  analyze,
};
