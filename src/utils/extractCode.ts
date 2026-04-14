import type { Node } from "oxc-parser";

export function extractCode(node: Node, code: string): string {
  return code.slice(node.start, node.end);
}
