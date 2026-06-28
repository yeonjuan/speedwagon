import { analyzeCrossFileDuplicates } from "./helpers.js";
import { serializeType } from "./serialize-type.js";
import type { DuplicationsAnalyzer } from "./types.js";

export const typeDeclaration: DuplicationsAnalyzer = {
  visitor(context) {
    return {
      TSTypeAliasDeclaration(node) {
        const key = serializeType(node.typeAnnotation);
        const display = node.id.name;
        context.collect({ key, display, offset: node.start });
      },
    };
  },
  analyze(context) {
    analyzeCrossFileDuplicates(
      context,
      (display) => `Duplicate type declaration \`${display}\``,
    );
  },
};
