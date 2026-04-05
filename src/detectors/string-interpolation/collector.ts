import type { StringInterpolationInfo } from "./types.js";
import { getPosition, createCollector } from "../../utils/index.js";

export interface StringInterpolationDetectorConfig {
  minOccurrences?: number;
}

export const stringInterpolationCollector = (
  config: StringInterpolationDetectorConfig,
) =>
  createCollector((context, filePath, sourceCode) => {
    let counter = 0;

    return {
      TemplateLiteral: (node) => {
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
        const existing =
          context.get<StringInterpolationInfo[]>(normalized) ?? [];

        const info: StringInterpolationInfo = {
          id: `${filePath}:${counter++}`,
          normalized,
          raw,
          location: {
            file: filePath,
            start: getPosition(sourceCode, node.start),
            end: getPosition(sourceCode, node.end),
          },
        };

        existing.push(info);
        context.set(normalized, existing);
      },
    };
  });
