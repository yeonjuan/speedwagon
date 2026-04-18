import type { TSEnumDeclaration, TSEnumMember } from "oxc-parser";
import type { Collector } from "./types.js";
import { getPosition } from "./ast-utils/index.js";

function normalizeMemberId(id: TSEnumMember["id"]): string {
  if (id.type === "Identifier") return id.name;
  if (id.type === "Literal") return String(id.value);
  return id.type;
}

function normalizeMember(member: TSEnumMember): string {
  const key = normalizeMemberId(member.id);
  if (!member.initializer) return key;
  const init = member.initializer;
  const value =
    "value" in init && init.value !== undefined
      ? String(init.value)
      : init.type;
  return `${key}=${value}`;
}

function normalize(node: TSEnumDeclaration): string {
  return node.body.members.map(normalizeMember).sort().join(",");
}

function print(node: TSEnumDeclaration, code: string): string {
  const MAX_LENGTH = 50;
  const raw = code
    .slice(node.body.start, node.body.end)
    .replace(/\s+/g, " ")
    .trim();
  return raw.length > MAX_LENGTH ? raw.slice(0, MAX_LENGTH) + "..." : raw;
}

export const enumDeclaration: Collector = {
  id: "enum-declaration",
  createJSVisitor(context) {
    return {
      TSEnumDeclaration(node) {
        const key = normalize(node);
        const displayName = print(node, context.code);
        context.add({
          key,
          displayName,
          location: {
            start: getPosition(context.code, node.start),
            end: getPosition(context.code, node.end),
          },
        });
      },
    };
  },
};
