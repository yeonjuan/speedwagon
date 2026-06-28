import type {
  TSEnumDeclaration,
  TSEnumMemberName,
  Expression,
} from "oxc-parser";
import { analyzeCrossFileDuplicates } from "./helpers.js";
import type { DuplicationsAnalyzer } from "./types.js";

function serializeMemberName(id: TSEnumMemberName): string {
  if (id.type === "Identifier") return id.name;
  if (id.type === "Literal")
    return typeof id.value === "string" ? id.value : String(id.value);
  return "?";
}

function serializeInitializer(expr: Expression): string {
  const e = expr as unknown as Record<string, unknown>;
  if (e.type === "Literal") {
    if (typeof e.value === "string") return JSON.stringify(e.value);
    return String(e.value);
  }
  if (e.type === "Identifier") return e.name as string;
  if (e.type === "UnaryExpression") {
    return `${e.operator}${serializeInitializer(e.argument as Expression)}`;
  }
  return "?";
}

function serializeEnum(node: TSEnumDeclaration): string {
  return node.body.members
    .map((m) => {
      const name = serializeMemberName(m.id);
      const val = m.initializer
        ? `=${serializeInitializer(m.initializer)}`
        : "";
      return `${name}${val}`;
    })
    .join(",");
}

export const enumDeclaration: DuplicationsAnalyzer = {
  visitor(context) {
    return {
      TSEnumDeclaration(node) {
        const key = serializeEnum(node);
        const display = node.id.name;
        context.collect({ key, display, offset: node.start });
      },
    };
  },
  analyze(context) {
    analyzeCrossFileDuplicates(
      context,
      (display) => `Duplicate enum declaration \`${display}\``,
    );
  },
};
