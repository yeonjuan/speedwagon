import type { TSEnumDeclaration } from "oxc-parser";

function tsEnumDeclaration(node: TSEnumDeclaration) {
  const { members } = node.body;
  members.map((member) => {
    return `${member.id.type}`;
  });

  return `enum(${node.body})`;
}
