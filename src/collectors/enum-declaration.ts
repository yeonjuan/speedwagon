import type { TSEnumMember } from "oxc-parser";
import type { Collector } from "./types.js";
import { getPosition } from "./ast-utils/index.js";

function extractMemberKey(member: TSEnumMember): string | null {
  if (!member.initializer) {
    return null;
  }
  const init = member.initializer;
  if (init.type !== "Literal") {
    return null;
  }
  const memberName = member.id.type === "Identifier" ? member.id.name : null;
  if (!memberName) {
    return null;
  }
  return `${memberName}:${JSON.stringify(init.value)}`;
}

// key format: `${membersKey}\x00${enumName}\x00${isExported ? "1" : "0"}`
export const enumDeclaration: Collector = {
  id: "enum-declaration",
  createJSVisitor(context) {
    let nextIsExported = false;
    return {
      ExportNamedDeclaration(node) {
        if (node.declaration?.type === "TSEnumDeclaration") {
          nextIsExported = true;
        }
      },
      TSEnumDeclaration(node) {
        const isExported = nextIsExported;
        nextIsExported = false;

        const members = node.body.members;
        if (members.length === 0) {
          return;
        }

        const hasExplicit = members.some((m) => m.initializer !== null);
        const hasImplicit = members.some((m) => m.initializer === null);

        let membersKey: string;

        if (hasExplicit && !hasImplicit) {
          const memberKeys = members.map(extractMemberKey);
          if (memberKeys.some((k) => k === null)) {
            return;
          }
          membersKey = `explicit:${(memberKeys as string[]).sort().join(",")}`;
        } else if (hasImplicit && !hasExplicit) {
          const names = members.map((m) =>
            m.id.type === "Identifier" ? m.id.name : null,
          );
          if (names.some((n) => n === null)) {
            return;
          }
          membersKey = `implicit:${(names as string[]).join(",")}`;
        } else {
          return;
        }

        context.add({
          key: `${membersKey}\x00${node.id.name}\x00${isExported ? "1" : "0"}`,
          location: {
            start: getPosition(context.code, node.start),
            end: getPosition(context.code, node.end),
          },
        });
      },
    };
  },
};
