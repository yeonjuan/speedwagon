import { walk, isBindingIdentifier, ScopeTracker } from "oxc-walker";
import type { Program, Node } from "oxc-parser";
import type { FoundFeature } from "./types.js";

const GLOBAL_ALIASES = new Set(["window", "globalThis", "self", "global"]);

const IGNORED_IDENTIFIERS = new Set([
  "undefined",
  "NaN",
  "Infinity",
  "arguments",
  "require",
  "module",
  "exports",
  "__dirname",
  "__filename",
]);

const TS_VALUE_CONTEXT = new Set([
  "TSAsExpression",
  "TSSatisfiesExpression",
  "TSTypeAssertion",
  "TSInstantiationExpression",
  "TSNonNullExpression",
  "TSExportAssignment",
  "TSEnumDeclaration",
  "TSEnumMember",
  "TSModuleDeclaration",
  "TSModuleBlock",
  "TSParameterProperty",
  "TSImportEqualsDeclaration",
  "TSExternalModuleReference",
]);

function isTypeOnlyNode(type: string): boolean {
  return type.startsWith("TS") && !TS_VALUE_CONTEXT.has(type);
}

interface PendingFeature {
  kind: "member" | "new" | "identifier";
  object: string | null;
  name: string;
  offset: number;
}

function getLineColumn(
  source: string,
  offset: number,
): { line: number; column: number } {
  const lines = source.slice(0, offset).split("\n");
  return { line: lines.length, column: lines[lines.length - 1].length };
}

export function collectJsFeatures(
  program: Program,
  source: string,
  filePath: string,
): FoundFeature[] {
  const scopeTracker = new ScopeTracker({ preserveExitedScopes: true });
  walk(program, { scopeTracker });
  scopeTracker.freeze();

  const pending: PendingFeature[] = [];

  walk(program, {
    scopeTracker,
    enter(node, parent) {
      if (isTypeOnlyNode(node.type)) {
        this.skip();
        return;
      }

      if (node.type === "MemberExpression" && !node.computed) {
        const property = node.property;
        if (property.type !== "Identifier") return;
        const propertyName = property.name;

        if (
          node.object.type === "Identifier" &&
          GLOBAL_ALIASES.has(node.object.name) &&
          !scopeTracker.isDeclared(node.object.name)
        ) {
          pending.push({
            kind: "identifier",
            object: null,
            name: propertyName,
            offset: node.start,
          });
          return;
        }

        let object =
          node.object.type === "Identifier" ? node.object.name : null;
        if (object !== null && scopeTracker.isDeclared(object)) object = null;
        pending.push({
          kind: "member",
          object,
          name: propertyName,
          offset: node.start,
        });
        return;
      }

      if (node.type === "NewExpression" && node.callee.type === "Identifier") {
        pending.push({
          kind: "new",
          object: null,
          name: node.callee.name,
          offset: node.start,
        });
        return;
      }

      if (node.type === "Identifier") {
        if (IGNORED_IDENTIFIERS.has(node.name)) return;
        if (isBindingIdentifier(node as Node, parent)) return;
        if (
          parent?.type === "MemberExpression" &&
          (parent.object === node ||
            (!parent.computed && parent.property === node))
        )
          return;
        if (parent?.type === "NewExpression" && parent.callee === node) return;
        if (
          parent?.type === "Property" &&
          parent.key === node &&
          !parent.computed
        )
          return;
        if (scopeTracker.isDeclared(node.name)) return;
        pending.push({
          kind: "identifier",
          object: null,
          name: node.name,
          offset: node.start,
        });
      }
    },
  });

  const seen = new Set<string>();
  const result: FoundFeature[] = [];
  for (const item of pending) {
    const { line, column } = getLineColumn(source, item.offset);
    const key = `${item.kind}:${item.object ?? ""}:${item.name}:${line}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({
      kind: item.kind,
      filePath,
      line,
      column,
      object: item.object,
      name: item.name,
    });
  }
  return result;
}
