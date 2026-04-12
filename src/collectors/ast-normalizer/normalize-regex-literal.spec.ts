import { describe, test, expect } from "vitest";
import { parseSync, Visitor } from "oxc-parser";
import type { RegExpLiteral } from "oxc-parser";
import { normalizer } from "./index.js";

function extractRegexLiteral(code: string): RegExpLiteral {
  const program = parseSync("test.js", code);
  let found: RegExpLiteral | null = null;
  new Visitor({
    Literal(node) {
      if ("regex" in node) found = node as RegExpLiteral;
    },
  }).visit(program.program);
  if (!found) throw new Error(`No regex literal found in: ${code}`);
  return found;
}

describe("normalizeRegexLiteral", () => {
  test.each(["/\\d+/g", "/foo/", "/abc/gi", "/^hello$/m", "/foo/i"])(
    "%s",
    (code) => {
      const node = extractRegexLiteral(`${code};`);
      expect(normalizer.normalizeRegexLiteral(node)).toMatchSnapshot();
    },
  );
});
