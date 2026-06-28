import { analyzeCrossFileDuplicates } from "./helpers.js";
import type { DuplicationsAnalyzer } from "./types.js";

export const regex: DuplicationsAnalyzer = {
  visitor(context) {
    return {
      Literal(node) {
        if (!("regex" in node) || !node.regex) return;
        const { pattern, flags } = node.regex;
        const sortedFlags = [...flags].sort().join("");
        const key = `/${pattern}/${sortedFlags}`;
        context.collect({ key, display: key, offset: node.start });
      },
    };
  },
  analyze(context) {
    analyzeCrossFileDuplicates(
      context,
      (display) => `Duplicate RegExp \`${display}\``,
    );
  },
};
