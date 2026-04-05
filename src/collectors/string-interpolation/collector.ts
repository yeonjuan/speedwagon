import type { StringInterpolationInfo } from "./types.js";
import { formatId } from "../../utils/index.js";
import {
  getPosition,
  createCollector,
  extractSnippet,
} from "../../utils/index.js";
import { AST_TYPES } from "../../constants/index.js";

export interface StringInterpolationCollectorConfig {
  minOccurrences?: number;
}

export const stringInterpolationCollector = (
  config: StringInterpolationCollectorConfig,
) =>
  createCollector((context, filePath, sourceCode) => {
    let counter = 0;

    return {
      [AST_TYPES.TemplateLiteral]: (node) => {
        const quasis = node.quasis;

        // Skip if all quasis are strictly empty or whitespace
        const allWhitespace = quasis.every((q: any) =>
          /^\s*$/.test(q.value.raw),
        );
        if (allWhitespace) return;

        // Ensure there is at least one expression interpolated
        if (!node.expressions || node.expressions.length === 0) return;

        // Construct the normalized template schema
        let normalized = "";
        for (let i = 0; i < quasis.length; i++) {
          normalized += quasis[i].value.raw;
          if (i < node.expressions.length) {
            normalized += "{$}";
          }
        }

        const raw = sourceCode.substring(node.start, node.end);
        const location = {
          file: filePath,
          start: getPosition(sourceCode, node.start),
          end: getPosition(sourceCode, node.end),
        };
        const snippet = extractSnippet(sourceCode, location, { useRaw: true });

        context.addInfo(
          normalized,
          formatId(filePath, counter++),
          location,
          snippet,
          {},
        );
      },
    };
  });
