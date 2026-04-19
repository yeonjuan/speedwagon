import type { TSEnumDeclaration, TSEnumMember } from "oxc-parser";
import type { Collector } from "./types.js";
import { getPosition, getDisplayName } from "./ast-utils/index.js";

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

export const enumDeclaration: Collector = {
  id: "enum-declaration",
  createJSVisitor(context) {
    return {
      TSEnumDeclaration(node) {
        const key = normalize(node);
        const displayName = getDisplayName(
          context.code,
          node.body.start,
          node.body.end,
        );
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
