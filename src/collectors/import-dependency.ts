import type {
  ExportAllDeclaration,
  ExportNamedDeclaration,
  ImportDeclaration,
} from "oxc-parser";
import { getPosition } from "./ast-utils/index.js";
import type { Collector } from "./types.js";

export const importDependency: Collector = {
  id: "import-dependency",
  createJSVisitor(context) {
    function recordImport(source: string, start: number, end: number) {
      const resolved = context.resolveImport(source);
      if (!resolved) return;

      context.add({
        key: resolved,
        displayName: source,
        location: {
          start: getPosition(context.code, start),
          end: getPosition(context.code, end),
        },
      });
    }

    return {
      ImportDeclaration(node: ImportDeclaration) {
        recordImport(node.source.value, node.start, node.end);
      },
      ExportNamedDeclaration(node: ExportNamedDeclaration) {
        if (node.source) {
          recordImport(node.source.value, node.start, node.end);
        }
      },
      ExportAllDeclaration(node: ExportAllDeclaration) {
        recordImport(node.source.value, node.start, node.end);
      },
    };
  },
};
